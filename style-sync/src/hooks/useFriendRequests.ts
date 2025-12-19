import { useState, useCallback } from 'react'
import { apiRequestJson } from '../utils/apiClient'
import { getFollowing, getFollowers, type FollowingUser, type FollowerUser } from '../utils/api/friends'

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
    shop_public_id?: string
  }
  receiver_profile?: {
    username: string
    display_name: string
    profile_pic: string
    shop_public_id?: string
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
  following: FollowingUser[]
  followers: FollowerUser[]
  isLoading: boolean
  error: string | null
  
  // Actions
  sendFriendRequest: (receiverUsername: string) => Promise<void>
  acceptFriendRequest: (requestId: string) => Promise<void>
  declineFriendRequest: (requestId: string) => Promise<void>
  revokeSentRequest: (requestId: string) => Promise<void>
  removeFriend: (friendId: string) => Promise<void>
  refreshData: () => Promise<void>
}

export function useFriendRequests(): UseFriendRequestsReturn {
  
  // State
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [following, setFollowing] = useState<FollowingUser[]>([])
  const [followers, setFollowers] = useState<FollowerUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper function to make API calls using centralized API client
  const makeApiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    return apiRequestJson(endpoint, options)
  }, [])

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
      const [sentRequestsData, receivedRequestsData, friendsData, followingData, followersData] = await Promise.all([
        makeApiCall('get-friend-requests?type=sent') as Promise<{ requests?: FriendRequest[] }>,
        makeApiCall('get-friend-requests?type=received') as Promise<{ requests?: FriendRequest[] }>,
        makeApiCall('get-friends') as Promise<{ friends?: Friend[] }>,
        getFollowing().catch(() => []), // Fallback to empty array on error
        getFollowers().catch(() => [])  // Fallback to empty array on error
      ])
      
      // Deduplicate requests and friends to prevent duplicates
      const deduplicatedSentRequests = deduplicateRequests(sentRequestsData.requests || [])
      const deduplicatedReceivedRequests = deduplicateRequests(receivedRequestsData.requests || [])
      const deduplicatedFriends = deduplicateFriends(friendsData.friends || [])
      
      // Debug logging
      console.log('[useFriendRequests] Raw received requests:', {
        raw: receivedRequestsData.requests,
        deduplicated: deduplicatedReceivedRequests,
        allStatuses: deduplicatedReceivedRequests.map(r => ({ id: r.id, status: r.status }))
      })
      
      // Filter received requests: show pending AND accepted (one-way follows from public profiles)
      // BUT exclude accepted requests where we've already followed back (mutual follows)
      // We check this by seeing if the sender is in our following list
      const followingUserIds = new Set((Array.isArray(followingData) ? followingData : []).map(f => f.user_id))
      
      const receivedRequestsToShow = deduplicatedReceivedRequests.filter(req => {
        // Show pending requests always
        if (req.status === 'pending') {
          return true
        }
        // For accepted requests, only show if we haven't followed them back yet
        // (i.e., they're not in our following list)
        if (req.status === 'accepted') {
          return !followingUserIds.has(req.sender_id)
        }
        return false
      })
      
      console.log('[useFriendRequests] Filtered received requests:', {
        count: receivedRequestsToShow.length,
        requests: receivedRequestsToShow.map(r => ({ id: r.id, status: r.status, sender_id: r.sender_id }))
      })
      
      // Filter sent requests - only show pending/declined requests (accepted ones are in following list)
      const pendingSentRequests = deduplicatedSentRequests.filter(
        req => req.status === 'pending' || req.status === 'declined'
      )
      setSentRequests(pendingSentRequests)
      setReceivedRequests(receivedRequestsToShow)
      setFriends(deduplicatedFriends)
      setFollowing(Array.isArray(followingData) ? followingData : [])
      setFollowers(Array.isArray(followersData) ? followersData : [])
      
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
      
      // If this is a "Follow Back" (accepted request), optimistically add to following list
      const isFollowBack = requestToAccept.status === 'accepted'
      
      if (isFollowBack) {
        // Optimistically add to following list
        setFollowing(prev => {
          const followingExists = prev.some(f => f.user_id === requestToAccept.sender_id)
          if (followingExists) {
            return prev
          }
          
          const newFollowing: FollowingUser = {
            id: requestId, // Temporary ID
            user_id: requestToAccept.sender_id,
            shop_public_id: requestToAccept.sender_profile?.shop_public_id || '',
            user_profile: {
              username: requestToAccept.sender_profile?.username || 'Unknown',
              display_name: requestToAccept.sender_profile?.display_name || 'Unknown',
              profile_pic: requestToAccept.sender_profile?.profile_pic || '',
              shop_public_id: requestToAccept.sender_profile?.shop_public_id || ''
            },
            followed_at: new Date().toISOString()
          }
          return [...prev, newFollowing]
        })
      }
      
      // Optimistically add to friends list (for mutual follows)
      setFriends(prev => {
        // Check if friend already exists by sender_id to prevent duplicates
        const friendExists = prev.some(f => f.friend_id === requestToAccept.sender_id)
        
        if (friendExists) {
          return prev
        }
        
        // Only add to friends if it's a follow back (will become mutual)
        if (isFollowBack) {
          // Construct friend object from request (temporary until refresh)
          const newFriend: Friend = {
            id: requestId, // Use request ID temporarily
            friend_id: requestToAccept.sender_id,
            shop_public_id: requestToAccept.sender_profile?.shop_public_id || '',
            friend_profile: {
              username: requestToAccept.sender_profile?.username || 'Unknown',
              display_name: requestToAccept.sender_profile?.display_name || 'Unknown',
              profile_pic: requestToAccept.sender_profile?.profile_pic || '',
              shop_public_id: requestToAccept.sender_profile?.shop_public_id || ''
            },
            created_at: new Date().toISOString()
          }
          
          return [...prev, newFriend]
        }
        
        return prev
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
      const isFollowBack = requestToAccept.status === 'accepted'
      setReceivedRequests(prev => {
        const exists = prev.some(r => r.id === requestId)
        return exists ? prev : [...prev, requestToAccept]
      })
      setFriends(prev => prev.filter(f => f.id !== requestId))
      if (isFollowBack) {
        setFollowing(prev => prev.filter(f => f.id !== requestId))
      }
      
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

  // Revoke a sent friend request
  const revokeSentRequest = useCallback(async (requestId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Find the request to get receiver_id
      const requestToRevoke = sentRequests.find(r => r.id === requestId)
      if (!requestToRevoke) {
        throw new Error('Request not found')
      }
      
      // Optimistically remove from sentRequests
      setSentRequests(prev => prev.filter(r => r.id !== requestId))
      
      // Use remove-friend endpoint which now handles both pending and accepted requests
      // Pass the receiver_id as friend_id
      await makeApiCall('remove-friend', {
        method: 'POST',
        body: JSON.stringify({ friend_id: requestToRevoke.receiver_id })
      })
      
      // Refresh data in background to ensure consistency
      await refreshData()
      
    } catch (error) {
      console.error('Error revoking sent request:', error)
      setError(error instanceof Error ? error.message : 'Failed to revoke request')
      
      // Revert optimistic update on error
      await refreshData()
      
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [makeApiCall, sentRequests, refreshData])

  // Remove friend / Unfollow
  const removeFriend = useCallback(async (friendId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Optimistically remove from friends and following lists
      setFriends(prev => prev.filter(f => f.friend_id !== friendId))
      setFollowing(prev => prev.filter(f => f.user_id !== friendId))
      
      await makeApiCall('remove-friend', {
        method: 'POST',
        body: JSON.stringify({ friend_id: friendId })
      })
      
      // Refresh data in background to ensure consistency
      await refreshData()
      
    } catch (error) {
      console.error('Error unfollowing user:', error)
      setError(error instanceof Error ? error.message : 'Failed to unfollow user')
      
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
    following,
    followers,
    isLoading,
    error,
    
    // Actions
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    revokeSentRequest,
    removeFriend,
    refreshData,
  }
}
