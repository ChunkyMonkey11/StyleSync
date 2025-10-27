import { useState, useEffect } from 'react'
import { useCurrentUser } from '@shopify/shop-minis-react'
import { FriendsPage } from './FriendsPage'
import { ProfilePage } from './ProfilePage'
import { ProfileEditPage } from './ProfileEditPage'
import { FeedPage } from './FeedPage'
import { CreatePostPage } from './CreatePostPage'
import { PostDetailPage } from './PostDetailPage'
import { useAuth } from '../hooks/useAuth'

interface UserProfile {
    id: string
    shop_public_id: string
    username: string
    display_name: string
    profile_pic: string
    bio: string
    interests: string[]
    style_preferences: string[]
    created_at: string
    updated_at: string
}

export function MainApp() {
    const { currentUser } = useCurrentUser()
    const { getValidToken } = useAuth()
    const [currentView, setCurrentView] = useState<'main' | 'friends' | 'profile' | 'profile-edit' | 'feed' | 'create-post' | 'post-detail'>('main')
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch user profile on mount
    useEffect(() => {
        fetchUserProfile()
    }, [])

    const fetchUserProfile = async () => {
        try {
            setIsLoading(true)
            setError(null)
            
            const token = await getValidToken()
            const response = await fetch(
                'https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/check-profile',
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            )

            if (!response.ok) {
                throw new Error(`Failed to fetch profile: ${response.status}`)
            }

            const result = await response.json()
            if (result.hasProfile && result.profile) {
                setProfile(result.profile)
            } else {
                setError('No profile found')
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
            setError(error instanceof Error ? error.message : 'Failed to load profile')
        } finally {
            setIsLoading(false)
        }
    }

    if (currentView === 'friends') {
        return <FriendsPage onBack={() => setCurrentView('main')} />
    }

    if (currentView === 'profile') {
        return (
            <ProfilePage 
                onBack={() => setCurrentView('main')} 
                onEdit={() => setCurrentView('profile-edit')}
            />
        )
    }

    if (currentView === 'profile-edit') {
        return (
            <ProfileEditPage 
                onBack={() => setCurrentView('profile')} 
                onSave={() => {
                    setCurrentView('profile')
                    // Refresh profile data after saving
                    fetchUserProfile()
                }}
            />
        )
    }

    if (currentView === 'feed') {
        return (
            <FeedPage 
                onBack={() => setCurrentView('main')} 
                onCreatePost={() => setCurrentView('create-post')}
                onViewPost={(postId) => {
                    setSelectedPostId(postId)
                    setCurrentView('post-detail')
                }}
            />
        )
    }

    if (currentView === 'create-post') {
        return (
            <CreatePostPage 
                onBack={() => setCurrentView('feed')} 
                onPostCreated={() => setCurrentView('feed')}
            />
        )
    }

    if (currentView === 'post-detail' && selectedPostId) {
        return (
            <PostDetailPage 
                postId={selectedPostId}
                onBack={() => setCurrentView('feed')}
            />
        )
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="p-4 max-w-md mx-auto">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold mb-2">StyleSync Feed</h1>
                    <p className="text-gray-600">Loading your profile...</p>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white p-4 rounded-lg border shadow-sm animate-pulse">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="p-4 max-w-md mx-auto">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold mb-2">StyleSync Feed</h1>
                    <p className="text-gray-600">Welcome back, {currentUser?.displayName || 'User'}!</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-red-700 mb-3">{error}</p>
                    <button 
                        onClick={fetchUserProfile}
                        className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 max-w-md mx-auto">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">StyleSync Feed</h1>
                <p className="text-gray-600">Welcome back, {currentUser?.displayName || 'User'}!</p>
            </div>

            <div className="space-y-4">
                {/* Profile Card */}
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-semibold">Your Style Profile</h2>
                        <button 
                            onClick={() => setCurrentView('profile')}
                            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                            View Profile
                        </button>
                    </div>
                    {profile ? (
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">@{profile.username}</span>
                                {profile.bio && ` • ${profile.bio}`}
                            </p>
                            <p className="text-xs text-gray-500">
                                Member since {new Date(profile.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-600">Profile created successfully!</p>
                    )}
                </div>

                {/* Recent Posts Card */}
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h2 className="font-semibold mb-2">Recent Posts</h2>
                    <p className="text-sm text-gray-600">No posts yet. Start sharing your style!</p>
                </div>

                {/* Style Preferences Card */}
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h2 className="font-semibold mb-2">Style Preferences</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {profile?.style_preferences && profile.style_preferences.length > 0 ? (
                            profile.style_preferences.map((preference, index) => (
                                <span 
                                    key={index}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                >
                                    {preference}
                                </span>
                            ))
                        ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                                No preferences set
                            </span>
                        )}
                    </div>
                </div>

                {/* Interests Card */}
                {profile?.interests && profile.interests.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <h2 className="font-semibold mb-2">Your Interests</h2>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {profile.interests.map((interest, index) => (
                                <span 
                                    key={index}
                                    className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded"
                                >
                                    {interest}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Feed Card */}
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h2 className="font-semibold mb-2">Style Feed</h2>
                    <p className="text-sm text-gray-600 mb-3">Discover posts from your friends and share your style!</p>
                    <button 
                        onClick={() => setCurrentView('feed')}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors mb-3"
                    >
                        View Feed
                    </button>
                </div>

                {/* Friends Card */}
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h2 className="font-semibold mb-2">Friends</h2>
                    <p className="text-sm text-gray-600 mb-3">Connect with friends to see their style!</p>
                    <button 
                        onClick={() => setCurrentView('friends')}
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Manage Friends
                    </button>
                </div>
            </div>
        </div>
    )
}
