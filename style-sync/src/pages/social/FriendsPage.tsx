import { useState, useEffect } from 'react'
import { Button, Input, Card, Image } from '@shopify/shop-minis-react'
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
                    <Card className="p-5 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg">
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
                    </Card>

                    {/* Sent Requests */}
                    {isLoading ? (
                        <Card className="p-5 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg">
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
                        </Card>
                    ) : sentRequests.length > 0 ? (
                        <Card className="p-5 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg">
                            <h3 className="font-semibold text-lg mb-4 text-gray-800">Sent Requests</h3>
                            <div className="space-y-3">
                                {sentRequests.map((request) => (
                                    <div 
                                        key={request.id} 
                                        className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:bg-white/80 transition-all duration-200"
                                    >
                                        {/* Avatar */}
                                        {request.receiver_profile?.profile_pic ? (
                                            <Image
                                                src={request.receiver_profile.profile_pic}
                                                alt={request.receiver_profile.username || 'User'}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center border-2 border-white shadow-sm">
                                                <span className="text-white text-lg font-semibold">
                                                    {(request.receiver_profile?.username || 'U')[0]?.toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-800 truncate">
                                                @{request.receiver_profile?.username || 'Unknown'}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate">
                                                {request.receiver_profile?.display_name || 'User'}
                                            </p>
                                        </div>
                                        
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                            request.status === 'pending' 
                                                ? 'bg-yellow-100 text-yellow-700' 
                                                : request.status === 'accepted'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {request.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ) : (
                        <Card className="p-8 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg text-center">
                            <div className="text-5xl mb-3">📤</div>
                            <h3 className="font-semibold text-lg mb-2 text-gray-800">No sent requests</h3>
                            <p className="text-sm text-gray-600">Send a friend request above to get started!</p>
                        </Card>
                    )}
                </div>
            )}

            {/* Received Requests Tab */}
            {activeTab === 'received' && (
                <div className="space-y-4">
                    {isLoading ? (
                        <Card className="p-5 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg">
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
                        </Card>
                    ) : receivedRequests.length === 0 ? (
                        <Card className="p-8 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg text-center">
                            <div className="text-5xl mb-3">📬</div>
                            <h3 className="font-semibold text-lg mb-2 text-gray-800">No friend requests</h3>
                            <p className="text-sm text-gray-600">When someone sends you a request, it will appear here!</p>
                        </Card>
                    ) : (
                        <Card className="p-5 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg">
                            <h3 className="font-semibold text-lg mb-4 text-gray-800">Friend Requests</h3>
                            <div className="space-y-3">
                                {receivedRequests.map((request) => (
                                    <div 
                                        key={request.id} 
                                        className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:bg-white/80 transition-all duration-200"
                                    >
                                        {/* Avatar */}
                                        {request.sender_profile?.profile_pic ? (
                                            <Image
                                                src={request.sender_profile.profile_pic}
                                                alt={request.sender_profile.username || 'User'}
                                                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
                                                <span className="text-white text-xl font-semibold">
                                                    {(request.sender_profile?.username || 'U')[0]?.toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-800 truncate">
                                                @{request.sender_profile?.username || 'Unknown'}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate">
                                                {request.sender_profile?.display_name || 'User'} wants to be friends
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
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* Friends Tab */}
            {activeTab === 'friends' && (
                <div className="space-y-4">
                    {isLoading ? (
                        <Card className="p-5 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg">
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
                        </Card>
                    ) : friends.length === 0 ? (
                        <Card className="p-8 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg text-center">
                            <div className="text-6xl mb-4">👥</div>
                            <h2 className="text-xl font-semibold mb-2 text-gray-800">No friends yet</h2>
                            <p className="text-gray-600 mb-6">Start by sending friend requests to see their style!</p>
                            <Button 
                                onClick={() => setActiveTab('send')} 
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 transition-all duration-200"
                            >
                                Send Friend Request
                            </Button>
                        </Card>
                    ) : (
                        <Card className="p-5 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg">
                            <h3 className="font-semibold text-lg mb-4 text-gray-800">
                                Your Friends <span className="text-purple-600">({friends.length})</span>
                            </h3>
                            <div className="space-y-3">
                                {friends.map((friend) => (
                                    <div 
                                        key={friend.id} 
                                        className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:bg-white/80 transition-all duration-200 group"
                                    >
                                        {/* Avatar */}
                                        {friend.friend_profile.profile_pic ? (
                                            <Image
                                                src={friend.friend_profile.profile_pic}
                                                alt={friend.friend_profile.username}
                                                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
                                                <span className="text-white text-xl font-semibold">
                                                    {friend.friend_profile.username[0]?.toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-800 truncate">
                                                @{friend.friend_profile.username}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate">
                                                {friend.friend_profile.display_name}
                                            </p>
                                        </div>
                                        
                                        <Button
                                            onClick={() => handleRemoveFriend(friend.friend_id)}
                                            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 active:scale-95 transition-all duration-200 shadow-sm opacity-0 group-hover:opacity-100"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    )
}