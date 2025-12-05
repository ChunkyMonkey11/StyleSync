import { useState, useEffect } from 'react'
import { Button, Input, Card } from '@shopify/shop-minis-react'
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
                <div className="mb-4 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded text-white text-sm">
                    {error}
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
                    <Card className="p-4">
                        <h2 className="font-semibold mb-3">Send Friend Request</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Username
                                </label>
                                <Input
                                    value={friendUsername}
                                    onChange={(e) => setFriendUsername(e.target.value)}
                                    placeholder="Enter username (e.g., johndoe)"
                                    className="w-full"
                                />
                            </div>
                            <Button
                                onClick={handleSendRequest}
                                disabled={!friendUsername.trim() || isSubmitting}
                                className="w-full"
                            >
                                {isSubmitting ? 'Sending...' : 'Send Friend Request'}
                            </Button>
                        </div>
                    </Card>

                    {/* Sent Requests */}
                    {isLoading ? (
                        <Card className="p-4">
                            <div className="animate-pulse">
                                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                            </div>
                        </Card>
                    ) : sentRequests.length > 0 ? (
                        <Card className="p-4">
                            <h3 className="font-semibold mb-3">Sent Requests</h3>
                            <div className="space-y-2">
                                {sentRequests.map((request) => (
                                    <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <span className="font-medium">@{request.receiver_profile?.username || 'Unknown'}</span>
                                            <p className="text-sm text-gray-500">
                                                {request.receiver_profile?.display_name || 'User'}
                                            </p>
                                        </div>
                                        <span className="text-sm text-gray-500 capitalize">{request.status}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ) : (
                        <Card className="p-4 text-center">
                            <p className="text-gray-600">No sent requests yet</p>
                        </Card>
                    )}
                </div>
            )}

            {/* Received Requests Tab */}
            {activeTab === 'received' && (
                <div className="space-y-4">
                    {isLoading ? (
                        <Card className="p-4">
                            <div className="animate-pulse">
                                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                            </div>
                        </Card>
                    ) : receivedRequests.length === 0 ? (
                        <Card className="p-4 text-center">
                            <p className="text-gray-600">No friend requests yet</p>
                        </Card>
                    ) : (
                        <Card className="p-4">
                            <h3 className="font-semibold mb-3">Friend Requests</h3>
                            <div className="space-y-3">
                                {receivedRequests.map((request) => (
                                    <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <span className="font-medium">@{request.sender_profile?.username || 'Unknown'}</span>
                                            <p className="text-sm text-gray-500">
                                                {request.sender_profile?.display_name || 'User'} wants to be friends
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleAcceptRequest(request.id)}
                                                className="px-3 py-1 bg-green-600 text-white text-sm hover:bg-green-700"
                                            >
                                                Accept
                                            </Button>
                                            <Button
                                                onClick={() => handleDeclineRequest(request.id)}
                                                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm hover:bg-gray-400"
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
                        <Card className="p-4">
                            <div className="animate-pulse">
                                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                            </div>
                        </Card>
                    ) : friends.length === 0 ? (
                        <Card className="p-4 text-center">
                            <div className="text-6xl mb-4">👥</div>
                            <h2 className="text-xl font-semibold mb-2">No friends yet</h2>
                            <p className="text-gray-600 mb-4">Start by sending friend requests!</p>
                            <Button onClick={() => setActiveTab('send')} className="w-full">
                                Send Friend Request
                            </Button>
                        </Card>
                    ) : (
                        <Card className="p-4">
                            <h3 className="font-semibold mb-3">Your Friends ({friends.length})</h3>
                            <div className="space-y-3">
                                {friends.map((friend) => (
                                    <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <span className="font-medium">@{friend.friend_profile.username}</span>
                                            <p className="text-sm text-gray-500">
                                                {friend.friend_profile.display_name}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => handleRemoveFriend(friend.friend_id)}
                                            className="px-3 py-1 bg-red-600 text-white text-sm hover:bg-red-700"
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