import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'

interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  updated_at: string
  sender_profile?: {
    username: string
    display_name: string
    profile_pic: string
  }
  receiver_profile?: {
    username: string
    display_name: string
    profile_pic: string
  }
}

interface Friend {
  id: string
  friend_id: string // UUID for remove-friend
  shop_public_id: string // shop_public_id for get-friend-feed
  friend_profile: {
    username: string
    display_name: string
    profile_pic: string
    shop_public_id: string
  }
  created_at: string
}

interface UseFriendRequestsReturn {
  // State
  sentRequests: FriendRequest[]
  receivedRequests: FriendRequest[]
  friends: Friend[]
  isLoading: boolean
  error: string | null
  
  // Actions
  sendFriendRequest: (receiverUsername: string) => Promise<void>
  acceptFriendRequest: (requestId: string) => Promise<void>
  declineFriendRequest: (requestId: string) => Promise<void>
  removeFriend: (friendId: string) => Promise<void>
  refreshData: () => Promise<void>
}

export function useFriendRequests(): UseFriendRequestsReturn {
  const { getValidToken } = useAuth()
  
  // State
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper function to make API calls
  const makeApiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const token = await getValidToken()
    
    const response = await fetch(
      `https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/${endpoint}`,
      {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `API call failed: ${response.status}`)
    }

    return response.json()
  }, [getValidToken])

  // Helper function to deduplicate requests by ID
  const deduplicateRequests = useCallback((requests: FriendRequest[]): FriendRequest[] => {
    const seen = new Set<string>()
    return requests.filter(request => {
      if (seen.has(request.id)) {
        return false
      }
      seen.add(request.id)
      return true
    })
  }, [])

  // Helper function to deduplicate friends by friend_id
  const deduplicateFriends = useCallback((friendsList: Friend[]): Friend[] => {
    const seen = new Set<string>()
    return friendsList.filter(friend => {
      if (seen.has(friend.friend_id)) {
        return false
      }
      seen.add(friend.friend_id)
      return true
    })
  }, [])

  // Refresh all data
  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch all data in parallel
      const [sentRequestsData, receivedRequestsData, friendsData] = await Promise.all([
        makeApiCall('get-friend-requests?type=sent'),
        makeApiCall('get-friend-requests?type=received'),
        makeApiCall('get-friends')
      ])
      
      // Deduplicate requests and friends to prevent duplicates
      const deduplicatedSentRequests = deduplicateRequests(sentRequestsData.requests || [])
      const deduplicatedReceivedRequests = deduplicateRequests(receivedRequestsData.requests || [])
      const deduplicatedFriends = deduplicateFriends(friendsData.friends || [])
      
      // Filter received requests to only show pending ones (accepted/declined should not appear)
      const pendingReceivedRequests = deduplicatedReceivedRequests.filter(
        req => req.status === 'pending'
      )
      
      // Filter sent requests - show all statuses so user can see if their request was accepted/declined
      setSentRequests(deduplicatedSentRequests)
      setReceivedRequests(pendingReceivedRequests)
      setFriends(deduplicatedFriends)
      
    } catch (error) {
      console.error('Error refreshing friend data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load friend data')
    } finally {
      setIsLoading(false)
    }
  }, [makeApiCall, deduplicateRequests, deduplicateFriends])

  // Send friend request
  const sendFriendRequest = useCallback(async (receiverUsername: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      await makeApiCall('send-friend-request', {
        method: 'POST',
        body: JSON.stringify({ receiver_username: receiverUsername })
      })
      
      // Refresh data after sending request
      await refreshData()
      
    } catch (error) {
      console.error('Error sending friend request:', error)
      setError(error instanceof Error ? error.message : 'Failed to send friend request')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [makeApiCall, refreshData])

  // Accept friend request
  const acceptFriendRequest = useCallback(async (requestId: string) => {
    // Find the request to get sender info for optimistic update
    const requestToAccept = receivedRequests.find(r => r.id === requestId)
    
    if (!requestToAccept?.sender_profile) {
      throw new Error('Friend request not found')
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      // Optimistically update UI: remove from receivedRequests immediately
      setReceivedRequests(prev => prev.filter(r => r.id !== requestId))
      
      // Optimistically add to friends list
      setFriends(prev => {
        // Check if friend already exists by sender_id to prevent duplicates
        const friendExists = prev.some(f => f.friend_id === requestToAccept.sender_id)
        
        if (friendExists) {
          return prev
        }
        
        // Construct friend object from request (temporary until refresh)
        // Note: shop_public_id will be updated correctly after refreshData
        const newFriend: Friend = {
          id: requestId, // Use request ID temporarily
          friend_id: requestToAccept.sender_id, // This is the UUID we need
          shop_public_id: '', // Will be updated on refresh, but friend_id is what matters
          friend_profile: {
            username: requestToAccept.sender_profile.username,
            display_name: requestToAccept.sender_profile.display_name,
            profile_pic: requestToAccept.sender_profile.profile_pic,
            shop_public_id: '' // Will be updated on refresh
          },
          created_at: new Date().toISOString()
        }
        
        return [...prev, newFriend]
      })
      
      await makeApiCall('respond-friend-request', {
        method: 'POST',
        body: JSON.stringify({ 
          request_id: requestId, 
          response: 'accepted' 
        })
      })
      
      // Small delay to ensure backend has processed the acceptance
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Refresh data to get correct shop_public_id and ensure consistency
      // This will replace the temporary friend object with the correct one
      // and filter out accepted requests from receivedRequests
      await refreshData()
      
    } catch (error) {
      console.error('Error accepting friend request:', error)
      setError(error instanceof Error ? error.message : 'Failed to accept friend request')
      
      // Revert optimistic update on error
      setReceivedRequests(prev => {
        const exists = prev.some(r => r.id === requestId)
        return exists ? prev : [...prev, requestToAccept]
      })
      setFriends(prev => prev.filter(f => f.id !== requestId))
      
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [makeApiCall, receivedRequests, refreshData])

  // Decline friend request
  const declineFriendRequest = useCallback(async (requestId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Optimistically remove from receivedRequests
      setReceivedRequests(prev => prev.filter(r => r.id !== requestId))
      
      await makeApiCall('respond-friend-request', {
        method: 'POST',
        body: JSON.stringify({ 
          request_id: requestId, 
          response: 'declined' 
        })
      })
      
      // Refresh data in background to ensure consistency
      await refreshData()
      
    } catch (error) {
      console.error('Error declining friend request:', error)
      setError(error instanceof Error ? error.message : 'Failed to decline friend request')
      
      // Revert optimistic update on error
      await refreshData()
      
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [makeApiCall, refreshData])

  // Remove friend
  const removeFriend = useCallback(async (friendId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Optimistically remove from friends list
      setFriends(prev => prev.filter(f => f.friend_id !== friendId))
      
      await makeApiCall('remove-friend', {
        method: 'POST',
        body: JSON.stringify({ friend_id: friendId })
      })
      
      // Refresh data in background to ensure consistency
      await refreshData()
      
    } catch (error) {
      console.error('Error removing friend:', error)
      setError(error instanceof Error ? error.message : 'Failed to remove friend')
      
      // Revert optimistic update on error
      await refreshData()
      
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [makeApiCall, refreshData])

  return {
    // State
    sentRequests,
    receivedRequests,
    friends,
    isLoading,
    error,
    
    // Actions
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    refreshData,
  }
}
