import { useState, useEffect } from 'react'
import { Button, Input } from '@shopify/shop-minis-react'
import { useFriendRequests } from '../../hooks/useFriendRequests'

interface FriendsPageProps {
    onBack: () => void
}

export function FriendsPage({ onBack }: FriendsPageProps) {
    const [activeTab, setActiveTab] = useState<'send' | 'received' | 'friends'>('send')
    const [friendUsername, setFriendUsername] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    const {
        sentRequests,
        receivedRequests,
        friends,
        isLoading,
        error,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        removeFriend,
        refreshData
    } = useFriendRequests()

    // Load data on mount
    useEffect(() => {
        refreshData()
    }, [refreshData])

    const handleSendRequest = async () => {
        if (!friendUsername.trim() || isSubmitting) return
        
        try {
            setIsSubmitting(true)
            await sendFriendRequest(friendUsername.trim())
            setFriendUsername('')
        } catch (error) {
            // Error is handled by the hook
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAcceptRequest = async (requestId: string) => {
        try {
            await acceptFriendRequest(requestId)
            // Switch to friends tab immediately after accepting
            setActiveTab('friends')
        } catch (error) {
            // Error is handled by the hook
        }
    }

    const handleDeclineRequest = async (requestId: string) => {
        try {
            await declineFriendRequest(requestId)
        } catch (error) {
            // Error is handled by the hook
        }
    }

    const handleRemoveFriend = async (friendId: string) => {
        try {
            await removeFriend(friendId)
        } catch (error) {
            // Error is handled by the hook
        }
    }

    return (
        <div className="min-h-screen  p-4 max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center mb-6 pt-4">
                <button 
                    onClick={onBack}
                    className="mr-3 px-4 py-2.5 rounded-2xl backdrop-blur-xl bg-white/20 border border-white/30 shadow-lg hover:bg-white/30 active:scale-95 transition-all duration-200 text-white font-medium"
                >
                    ← Back
                </button>
                <h1 className="text-2xl font-bold text-white">Friends</h1>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl text-white text-sm shadow-lg">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">⚠️</span>
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex mb-6 bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
                <button
                    onClick={() => setActiveTab('send')}
                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                        activeTab === 'send' 
                            ? 'bg-white text-purple-600 shadow-sm font-medium' 
                            : 'text-white/80 hover:text-white'
                    }`}
                >
                    Send Request
                </button>
                <button
                    onClick={() => setActiveTab('received')}
                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                        activeTab === 'received' 
                            ? 'bg-white text-purple-600 shadow-sm font-medium' 
                            : 'text-white/80 hover:text-white'
                    }`}
                >
                    Received ({receivedRequests.length})
                </button>
                <button
                    onClick={() => setActiveTab('friends')}
                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                        activeTab === 'friends' 
                            ? 'bg-white text-purple-600 shadow-sm font-medium' 
                            : 'text-white/80 hover:text-white'
                    }`}
                >
                    Friends ({friends.length})
                </button>
            </div>

            {/* Send Request Tab */}
            {activeTab === 'send' && (
                <div className="space-y-4">
                    <div className="p-5 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg rounded-xl">
                        <h2 className="font-semibold text-lg mb-4 text-gray-800">Send Friend Request</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Username
                                </label>
                                <Input
                                    value={friendUsername}
                                    onChange={(e) => setFriendUsername(e.target.value)}
                                    placeholder="Enter username (e.g., johndoe)"
                                    className="w-full"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && friendUsername.trim() && !isSubmitting) {
                                            handleSendRequest()
                                        }
                                    }}
                                />
                            </div>
                            <Button
                                onClick={handleSendRequest}
                                disabled={!friendUsername.trim() || isSubmitting}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Sending...' : 'Send Friend Request'}
                            </Button>
                        </div>
                    </div>

                    {/* Sent Requests */}
                    {isLoading ? (
                        <div className="p-5 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg rounded-xl">
                            <div className="animate-pulse space-y-3">
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-200 rounded mb-2 w-24"></div>
                                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : sentRequests.length > 0 ? (
                        <div className="p-5 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg rounded-xl">
                            <h3 className="font-semibold text-lg mb-4 text-gray-800">Sent Requests</h3>
                            <div className="space-y-3">
                                {sentRequests.map((request) => {
                                    const receiverProfile = request.receiver_profile || {}
                                    const username = receiverProfile.username || 'Unknown'
                                    const displayName = receiverProfile.display_name || username
                                    const profilePic = receiverProfile.profile_pic
                                    
                                    return (
                                        <div 
                                            key={request.id} 
                                            className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:bg-white/80 transition-all duration-200"
                                        >
                                            {/* Avatar */}
                                            {profilePic ? (
                                                <img
                                                    src={profilePic}
                                                    alt={username}
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
                                                    <span className="text-white text-lg font-semibold">
                                                        {username[0]?.toUpperCase() || 'U'}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 truncate" style={{ color: '#111827' }}>
                                                    @{username}
                                                </p>
                                                <p className="text-sm text-gray-600 truncate" style={{ color: '#4B5563' }}>
                                                    {displayName}
                                                </p>
                                            </div>
                                            
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                                                request.status === 'pending' 
                                                    ? 'bg-yellow-100 text-yellow-700' 
                                                    : request.status === 'accepted'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {request.status}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg rounded-xl text-center">
                            <div className="text-5xl mb-3">📤</div>
                            <h3 className="font-semibold text-lg mb-2 text-gray-800">No sent requests</h3>
                            <p className="text-sm text-gray-600">Send a friend request above to get started!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Received Requests Tab */}
            {activeTab === 'received' && (
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="p-5 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg rounded-xl">
                            <div className="animate-pulse space-y-3">
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-200 rounded mb-2 w-24"></div>
                                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="w-16 h-8 bg-gray-200 rounded"></div>
                                            <div className="w-16 h-8 bg-gray-200 rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : receivedRequests.length === 0 ? (
                        <div className="p-8 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg rounded-xl text-center">
                            <div className="text-5xl mb-3">📬</div>
                            <h3 className="font-semibold text-lg mb-2 text-gray-800">No friend requests</h3>
                            <p className="text-sm text-gray-600">When someone sends you a request, it will appear here!</p>
                        </div>
                    ) : (
                        <div className="p-5 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg rounded-xl">
                            <h3 className="font-semibold text-lg mb-4 text-gray-800">Friend Requests</h3>
                            <div className="space-y-3">
                                {receivedRequests.map((request) => {
                                    const senderProfile = request.sender_profile || {}
                                    const username = senderProfile.username || 'Unknown'
                                    const displayName = senderProfile.display_name || username
                                    const profilePic = senderProfile.profile_pic
                                    
                                    return (
                                        <div 
                                            key={request.id} 
                                            className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:bg-white/80 transition-all duration-200"
                                        >
                                            {/* Avatar */}
                                            {profilePic ? (
                                                <img
                                                    src={profilePic}
                                                    alt={username}
                                                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
                                                    <span className="text-white text-xl font-semibold">
                                                        {username[0]?.toUpperCase() || 'U'}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 truncate" style={{ color: '#111827' }}>
                                                    @{username}
                                                </p>
                                                <p className="text-sm text-gray-600 truncate" style={{ color: '#4B5563' }}>
                                                    {displayName} wants to be friends
                                                </p>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-shrink-0">
                                                <Button
                                                    onClick={() => handleAcceptRequest(request.id)}
                                                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:scale-95 transition-all duration-200 shadow-sm"
                                                >
                                                    Accept
                                                </Button>
                                                <Button
                                                    onClick={() => handleDeclineRequest(request.id)}
                                                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 active:scale-95 transition-all duration-200"
                                                >
                                                    Decline
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Friends Tab */}
            {activeTab === 'friends' && (
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="p-5 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg rounded-xl">
                            <div className="animate-pulse space-y-3">
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-200 rounded mb-2 w-24"></div>
                                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                                        </div>
                                        <div className="w-20 h-8 bg-gray-200 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : friends.length === 0 ? (
                        <div className="p-8 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg rounded-xl text-center">
                            <div className="text-6xl mb-4">👥</div>
                            <h2 className="text-xl font-semibold mb-2 text-gray-800">No friends yet</h2>
                            <p className="text-gray-600 mb-6">Start by sending friend requests to see their style!</p>
                            <Button 
                                onClick={() => setActiveTab('send')} 
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 transition-all duration-200"
                            >
                                Send Friend Request
                            </Button>
                        </div>
                    ) : (
                        <div className="p-5 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg rounded-xl">
                            <h3 className="font-semibold text-lg mb-4 text-gray-800">
                                Your Friends <span className="text-purple-600">({friends.length})</span>
                            </h3>
                            <div className="space-y-3">
                                {friends.map((friend) => {
                                    const friendProfile = friend.friend_profile || {}
                                    const username = friendProfile.username || 'Unknown'
                                    const displayName = friendProfile.display_name || username
                                    const profilePic = friendProfile.profile_pic
                                    
                                    return (
                                        <div 
                                            key={friend.id} 
                                            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                                        >
                                            {/* Avatar */}
                                            {profilePic ? (
                                                <img
                                                    src={profilePic}
                                                    alt={username}
                                                    className="w-14 h-14 rounded-full object-cover border-2 border-purple-200 shadow-sm flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center border-2 border-purple-200 shadow-sm flex-shrink-0">
                                                    <span className="text-white text-xl font-semibold">
                                                        {username[0]?.toUpperCase() || '?'}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {/* Name and Display Name */}
                                            <div className="flex-1 min-w-0 pr-3">
                                                <p 
                                                    className="font-semibold truncate text-base mb-0.5" 
                                                    style={{ 
                                                        color: '#111827',
                                                        fontWeight: '600',
                                                        fontSize: '16px',
                                                        lineHeight: '1.25'
                                                    }}
                                                >
                                                    @{username}
                                                </p>
                                                <p 
                                                    className="text-sm truncate" 
                                                    style={{ 
                                                        color: '#6B7280',
                                                        fontSize: '14px',
                                                        lineHeight: '1.25'
                                                    }}
                                                >
                                                    {displayName}
                                                </p>
                                            </div>
                                            
                                            <button
                                                onClick={() => handleRemoveFriend(friend.friend_id)}
                                                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 active:scale-95 transition-all duration-200 shadow-sm flex-shrink-0 whitespace-nowrap"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}