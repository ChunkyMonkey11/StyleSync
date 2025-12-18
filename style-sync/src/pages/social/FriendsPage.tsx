import { useState, useEffect } from 'react'
import { Button, Input } from '@shopify/shop-minis-react'
import { useFriendRequests } from '../../hooks/useFriendRequests'
import { getPublicProfiles, type PublicProfile } from '../../utils/api/publicProfiles'

interface FriendsPageProps {
    onBack: () => void
}

export function FriendsPage({ onBack }: FriendsPageProps) {
    const [activeTab, setActiveTab] = useState<'send' | 'received' | 'following' | 'followers' | 'friends' | 'public'>('send')
    const [friendUsername, setFriendUsername] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [publicProfiles, setPublicProfiles] = useState<PublicProfile[]>([])
    const [isLoadingPublic, setIsLoadingPublic] = useState(false)
    const [addingProfileId, setAddingProfileId] = useState<string | null>(null)
    
    const {
        sentRequests,
        receivedRequests,
        friends,
        following,
        followers,
        isLoading,
        error,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        revokeSentRequest,
        removeFriend,
        refreshData
    } = useFriendRequests()

    // Load data on mount
    useEffect(() => {
        refreshData()
    }, [refreshData])

    // Fetch public profiles when tab is active
    useEffect(() => {
        if (activeTab === 'public') {
            fetchPublicProfiles()
        }
    }, [activeTab])

    const fetchPublicProfiles = async () => {
        try {
            setIsLoadingPublic(true)
            const profiles = await getPublicProfiles()
            setPublicProfiles(profiles)
        } catch (error) {
            console.error('Error fetching public profiles:', error)
        } finally {
            setIsLoadingPublic(false)
        }
    }

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
            // Find the request to check if it's a "Follow Back" (accepted status)
            const request = receivedRequests.find(r => r.id === requestId)
            const isFollowBack = request?.status === 'accepted'
            
            await acceptFriendRequest(requestId)
            // Switch to following tab if it's a follow back, otherwise friends tab
            setActiveTab(isFollowBack ? 'following' : 'friends')
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
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 p-4 max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center mb-5 pt-4">
                <button 
                    onClick={onBack}
                    className="mr-3 p-2.5 rounded-xl backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 shadow-lg active:scale-95 transition-all duration-200 text-white"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold text-white tracking-tight">Friends</h1>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-3.5 bg-red-500/20 backdrop-blur-md border border-red-400/40 rounded-xl text-white text-sm shadow-lg">
                    <div className="flex items-center gap-2.5">
                        <span className="text-lg flex-shrink-0">⚠️</span>
                        <span className="flex-1">{error}</span>
                    </div>
                </div>
            )}

            {/* Tabs - Scrollable horizontal scroll */}
            <div className="mb-5 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 min-w-max pb-2">
                    {[
                        { key: 'send', label: 'Send', count: null },
                        { key: 'received', label: 'Received', count: receivedRequests.length },
                        { key: 'following', label: 'Following', count: following.length },
                        { key: 'followers', label: 'Followers', count: followers.length },
                        { key: 'friends', label: 'Mutual', count: friends.length },
                        { key: 'public', label: 'Discover', count: null }
                    ].map((tab) => {
                        const isActive = activeTab === tab.key
                        return (
                <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                className={`px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                                    isActive
                                        ? 'bg-white text-purple-600 shadow-lg scale-105' 
                                        : 'bg-white/10 text-white/90 hover:bg-white/20 hover:text-white border border-white/10'
                    }`}
                >
                                <span>{tab.label}</span>
                                {tab.count !== null && tab.count > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                                        isActive 
                                            ? 'bg-purple-100 text-purple-700' 
                                            : 'bg-white/20 text-white'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                </button>
                        )
                    })}
                </div>
            </div>

            {/* Send Request Tab */}
            {activeTab === 'send' && (
                <div className="space-y-4">
                    <div className="p-6 bg-white/95 backdrop-blur-md border border-white/40 shadow-xl rounded-2xl">
                        <h2 className="font-bold text-xl mb-1 text-gray-900">Send Friend Request</h2>
                        <p className="text-sm text-gray-600 mb-5">Connect with friends by their username</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    Username
                                </label>
                                <Input
                                    value={friendUsername}
                                    onChange={(e) => setFriendUsername(e.target.value)}
                                    placeholder="@username"
                                    className="w-full text-base text-gray-900"
                                    style={{ color: '#111827' }}
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
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                {isSubmitting ? 'Sending...' : 'Send Request'}
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
                        <div className="bg-white/95 backdrop-blur-md border border-white/40 shadow-xl rounded-2xl overflow-hidden">
                            <div className="p-5 border-b border-gray-200/50">
                                <h3 className="font-bold text-lg text-gray-900">Pending Requests</h3>
                                <p className="text-sm text-gray-600 mt-0.5">{sentRequests.length} request{sentRequests.length !== 1 ? 's' : ''} sent</p>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {sentRequests.map((request) => {
                                    const receiverProfile = request.receiver_profile
                                    const username = receiverProfile?.username || 'Unknown'
                                    const displayName = receiverProfile?.display_name || username
                                    const profilePic = receiverProfile?.profile_pic
                                    
                                    return (
                                        <div 
                                            key={request.id} 
                                            className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors"
                                        >
                                            {/* Avatar */}
                                            {profilePic ? (
                                                <img
                                                    src={profilePic}
                                                    alt={username}
                                                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 shadow-sm flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center border-2 border-gray-200 shadow-sm flex-shrink-0">
                                                    <span className="text-white text-lg font-bold">
                                                        {username[0]?.toUpperCase() || 'U'}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 truncate text-base">
                                                    {displayName}
                                                </p>
                                                <p className="text-sm text-gray-500 truncate mt-0.5">
                                                    @{username}
                                                </p>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${
                                                request.status === 'pending' 
                                                        ? 'bg-amber-100 text-amber-700' 
                                                    : request.status === 'accepted'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {request.status}
                                            </span>
                                                {request.status === 'pending' && (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await revokeSentRequest(request.id)
                                                            } catch (error) {
                                                                // Error is handled by the hook
                                                            }
                                                        }}
                                                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold rounded-lg active:scale-95 transition-all duration-200 whitespace-nowrap"
                                                    >
                                                        Revoke
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="p-10 bg-white/95 backdrop-blur-md border border-white/40 shadow-xl rounded-2xl text-center">
                            <div className="text-6xl mb-4">📤</div>
                            <h3 className="font-bold text-lg mb-2 text-gray-900">No sent requests</h3>
                            <p className="text-sm text-gray-600">Send a friend request above to connect!</p>
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
                        <div className="p-10 bg-white/95 backdrop-blur-md border border-white/40 shadow-xl rounded-2xl text-center">
                            <div className="text-6xl mb-4">📬</div>
                            <h3 className="font-bold text-lg mb-2 text-gray-900">No friend requests</h3>
                            <p className="text-sm text-gray-600">When someone sends you a request, it will appear here!</p>
                        </div>
                    ) : (
                        <div className="bg-white/95 backdrop-blur-md border border-white/40 shadow-xl rounded-2xl overflow-hidden">
                            <div className="p-5 border-b border-gray-200/50">
                                <h3 className="font-bold text-lg text-gray-900">Friend Requests</h3>
                                <p className="text-sm text-gray-600 mt-0.5">{receivedRequests.length} new request{receivedRequests.length !== 1 ? 's' : ''}</p>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {receivedRequests.map((request) => {
                                    const senderProfile = request.sender_profile
                                    const username = senderProfile?.username || 'Unknown'
                                    const displayName = senderProfile?.display_name || username
                                    const profilePic = senderProfile?.profile_pic
                                    const isFollowingYou = request.status === 'accepted'
                                    
                                    return (
                                        <div 
                                            key={request.id} 
                                            className="p-5 hover:bg-gray-50/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4 mb-4">
                                            {/* Avatar */}
                                            {profilePic ? (
                                                <img
                                                    src={profilePic}
                                                    alt={username}
                                                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow-md flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center border-2 border-gray-200 shadow-md flex-shrink-0">
                                                        <span className="text-white text-xl font-bold">
                                                            {username[0]?.toUpperCase() || 'U'}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 truncate text-base">
                                                        {displayName}
                                                    </p>
                                                    <p className="text-sm text-gray-500 truncate mt-0.5">
                                                        @{username}
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1.5">
                                                        {isFollowingYou 
                                                            ? '👤 Following you' 
                                                            : '🤝 Wants to be friends'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAcceptRequest(request.id)}
                                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-sm font-semibold rounded-xl active:scale-95 transition-all duration-200 shadow-md"
                                                >
                                                    {isFollowingYou ? 'Follow Back' : 'Accept'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeclineRequest(request.id)}
                                                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl active:scale-95 transition-all duration-200"
                                                >
                                                    {isFollowingYou ? 'Remove' : 'Decline'}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Public Profiles Tab */}
            {activeTab === 'public' && (
                <div className="space-y-4">
                    {isLoadingPublic ? (
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
                    ) : publicProfiles.length === 0 ? (
                        <div className="p-10 bg-white/95 backdrop-blur-md border border-white/40 shadow-xl rounded-2xl text-center">
                            <div className="text-6xl mb-4">🌍</div>
                            <h3 className="font-bold text-lg mb-2 text-gray-900">No profiles to discover</h3>
                            <p className="text-sm text-gray-600">Public profiles will appear here when users set their profiles to public!</p>
                        </div>
                    ) : (
                        <div className="bg-white/95 backdrop-blur-md border border-white/40 shadow-xl rounded-2xl overflow-hidden">
                            <div className="p-5 border-b border-gray-200/50">
                                <h3 className="font-bold text-lg text-gray-900">Discover</h3>
                                <p className="text-sm text-gray-600 mt-0.5">{publicProfiles.length} public {publicProfiles.length === 1 ? 'profile' : 'profiles'}</p>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {publicProfiles.map((profile) => (
                                    <div 
                                        key={profile.id} 
                                        className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors"
                                    >
                                        {/* Avatar */}
                                        {profile.profile_pic ? (
                                            <img
                                                src={profile.profile_pic}
                                                alt={profile.username}
                                                className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 shadow-sm flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center border-2 border-gray-200 shadow-sm flex-shrink-0">
                                                <span className="text-white text-lg font-bold">
                                                    {profile.username[0]?.toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 truncate text-base">
                                                {profile.display_name}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate mt-0.5">
                                                @{profile.username}
                                            </p>
                                        </div>
                                        
                                        <button
                                            onClick={async () => {
                                                try {
                                                    setAddingProfileId(profile.id)
                                                    await sendFriendRequest(profile.username)
                                                    await fetchPublicProfiles()
                                                    await refreshData()
                                                } catch (error) {
                                                    console.error('Error sending friend request:', error)
                                                } finally {
                                                    setAddingProfileId(null)
                                                }
                                            }}
                                            disabled={addingProfileId === profile.id}
                                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl active:scale-95 transition-all duration-200 shadow-md flex-shrink-0 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {addingProfileId === profile.id ? 'Adding...' : 'Follow'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Following Tab */}
            {activeTab === 'following' && (
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
                    ) : following.length === 0 ? (
                        <div className="p-8 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg rounded-xl text-center">
                            <div className="text-5xl mb-3">👥</div>
                            <h3 className="font-semibold text-lg mb-2 text-gray-800">Not following anyone yet</h3>
                            <p className="text-sm text-gray-600">Start following people to see their style!</p>
                        </div>
                    ) : (
                        <div className="bg-white/95 backdrop-blur-md border border-white/40 shadow-xl rounded-2xl overflow-hidden">
                            <div className="p-5 border-b border-gray-200/50">
                                <h3 className="font-bold text-lg text-gray-900">Following</h3>
                                <p className="text-sm text-gray-600 mt-0.5">{following.length} {following.length === 1 ? 'person' : 'people'}</p>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {following.map((follow) => (
                                    <div 
                                        key={follow.id} 
                                        className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors"
                                    >
                                        {/* Avatar */}
                                        {follow.user_profile.profile_pic ? (
                                            <img
                                                src={follow.user_profile.profile_pic}
                                                alt={follow.user_profile.username}
                                                className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 shadow-sm flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center border-2 border-gray-200 shadow-sm flex-shrink-0">
                                                <span className="text-white text-lg font-bold">
                                                    {follow.user_profile.username[0]?.toUpperCase() || '?'}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {/* Name and Display Name */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 truncate text-base">
                                                {follow.user_profile.display_name}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate mt-0.5">
                                                @{follow.user_profile.username}
                                            </p>
                                        </div>
                                        
                                        <button
                                            onClick={() => removeFriend(follow.user_id)}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl active:scale-95 transition-all duration-200 flex-shrink-0 whitespace-nowrap"
                                        >
                                            Unfollow
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Followers Tab */}
            {activeTab === 'followers' && (
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
                    ) : followers.length === 0 ? (
                        <div className="p-8 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg rounded-xl text-center">
                            <div className="text-5xl mb-3">👤</div>
                            <h3 className="font-semibold text-lg mb-2 text-gray-800">No followers yet</h3>
                            <p className="text-sm text-gray-600">When someone follows you, they'll appear here!</p>
                        </div>
                    ) : (
                        <div className="bg-white/95 backdrop-blur-md border border-white/40 shadow-xl rounded-2xl overflow-hidden">
                            <div className="p-5 border-b border-gray-200/50">
                                <h3 className="font-bold text-lg text-gray-900">Followers</h3>
                                <p className="text-sm text-gray-600 mt-0.5">{followers.length} {followers.length === 1 ? 'follower' : 'followers'}</p>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {followers.map((follower) => {
                                    // Check if you're also following them (mutual)
                                    const isFollowing = following.some(f => f.user_id === follower.user_id)
                                    
                                    return (
                                        <div 
                                            key={follower.id} 
                                            className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors"
                                        >
                                            {/* Avatar */}
                                            {follower.user_profile.profile_pic ? (
                                                <img
                                                    src={follower.user_profile.profile_pic}
                                                    alt={follower.user_profile.username}
                                                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 shadow-sm flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center border-2 border-gray-200 shadow-sm flex-shrink-0">
                                                    <span className="text-white text-lg font-bold">
                                                        {follower.user_profile.username[0]?.toUpperCase() || '?'}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {/* Name and Display Name */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 truncate text-base">
                                                    {follower.user_profile.display_name}
                                                </p>
                                                <p className="text-sm text-gray-500 truncate mt-0.5">
                                                    @{follower.user_profile.username}
                                                    {isFollowing && (
                                                        <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                                                            Following
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-shrink-0">
                                                {!isFollowing ? (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await sendFriendRequest(follower.user_profile.username)
                                                                await refreshData()
                                                            } catch (error) {
                                                                console.error('Error following back:', error)
                                                            }
                                                        }}
                                                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl active:scale-95 transition-all duration-200 shadow-md whitespace-nowrap"
                                                    >
                                                        Follow
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleRemoveFriend(follower.user_id)}
                                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl active:scale-95 transition-all duration-200 whitespace-nowrap"
                                                >
                                                        Unfollow
                                                    </button>
                                                )}
                                                <button
                                                    onClick={async () => {
                                                        // Remove as follower = decline/delete the request where they follow you
                                                        // The follower.id is the request ID from get-followers
                                                        await declineFriendRequest(follower.id)
                                                    }}
                                                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-semibold rounded-xl active:scale-95 transition-all duration-200 whitespace-nowrap"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Friends Tab (Mutual Follows) */}
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
                        <div className="p-10 bg-white/95 backdrop-blur-md border border-white/40 shadow-xl rounded-2xl text-center">
                            <div className="text-6xl mb-4">👥</div>
                            <h2 className="text-xl font-bold mb-2 text-gray-900">No mutual friends yet</h2>
                            <p className="text-gray-600 mb-6">Start by following people and they follow you back!</p>
                            <button 
                                onClick={() => setActiveTab('public')} 
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg"
                            >
                                Discover People
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white/95 backdrop-blur-md border border-white/40 shadow-xl rounded-2xl overflow-hidden">
                            <div className="p-5 border-b border-gray-200/50">
                                <h3 className="font-bold text-lg text-gray-900">Mutual Follows</h3>
                                <p className="text-sm text-gray-600 mt-0.5">{friends.length} mutual {friends.length === 1 ? 'friend' : 'friends'}</p>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {friends.map((friend) => {
                                    const friendProfile = friend.friend_profile || {}
                                    const username = friendProfile.username || 'Unknown'
                                    const displayName = friendProfile.display_name || username
                                    const profilePic = friendProfile.profile_pic
                                    
                                    return (
                                        <div 
                                            key={friend.id} 
                                            className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors"
                                        >
                                            {/* Avatar */}
                                            {profilePic ? (
                                                <img
                                                    src={profilePic}
                                                    alt={username}
                                                    className="w-14 h-14 rounded-full object-cover border-2 border-purple-300 shadow-sm flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center border-2 border-purple-300 shadow-sm flex-shrink-0">
                                                    <span className="text-white text-lg font-bold">
                                                        {username[0]?.toUpperCase() || '?'}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {/* Name and Display Name */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 truncate text-base">
                                                    {displayName}
                                                </p>
                                                <p className="text-sm text-gray-500 truncate mt-0.5">
                                                    @{username}
                                                </p>
                                            </div>
                                            
                                            <button
                                                onClick={() => handleRemoveFriend(friend.friend_id)}
                                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl active:scale-95 transition-all duration-200 shadow-md flex-shrink-0 whitespace-nowrap"
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