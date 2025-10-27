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
  friend_id: string
  friend_profile: {
    username: string
    display_name: string
    profile_pic: string
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
  }, [makeApiCall])

  // Accept friend request
  const acceptFriendRequest = useCallback(async (requestId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      await makeApiCall('respond-friend-request', {
        method: 'POST',
        body: JSON.stringify({ 
          request_id: requestId, 
          response: 'accepted' 
        })
      })
      
      // Refresh data after accepting request
      await refreshData()
      
    } catch (error) {
      console.error('Error accepting friend request:', error)
      setError(error instanceof Error ? error.message : 'Failed to accept friend request')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [makeApiCall])

  // Decline friend request
  const declineFriendRequest = useCallback(async (requestId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      await makeApiCall('respond-friend-request', {
        method: 'POST',
        body: JSON.stringify({ 
          request_id: requestId, 
          response: 'declined' 
        })
      })
      
      // Refresh data after declining request
      await refreshData()
      
    } catch (error) {
      console.error('Error declining friend request:', error)
      setError(error instanceof Error ? error.message : 'Failed to decline friend request')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [makeApiCall])

  // Remove friend
  const removeFriend = useCallback(async (friendId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      await makeApiCall('remove-friend', {
        method: 'POST',
        body: JSON.stringify({ friend_id: friendId })
      })
      
      // Refresh data after removing friend
      await refreshData()
      
    } catch (error) {
      console.error('Error removing friend:', error)
      setError(error instanceof Error ? error.message : 'Failed to remove friend')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [makeApiCall])

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
      
      setSentRequests(sentRequestsData.requests || [])
      setReceivedRequests(receivedRequestsData.requests || [])
      setFriends(friendsData.friends || [])
      
    } catch (error) {
      console.error('Error refreshing friend data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load friend data')
    } finally {
      setIsLoading(false)
    }
  }, [makeApiCall])

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
