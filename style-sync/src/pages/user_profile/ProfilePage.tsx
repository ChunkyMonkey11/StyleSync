import { useState, useEffect } from 'react'
import { Card, Button, Image } from '@shopify/shop-minis-react'
import { useAuth } from '../../hooks/useAuth'
import { useFriendRequests } from '../../hooks/useFriendRequests'
import { apiRequestJson } from '../../utils/apiClient'

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

interface ProfilePageProps {
    onBack: () => void
    onEdit: () => void
}

export function ProfilePage({ onBack, onEdit }: ProfilePageProps) {
    const {} = useAuth() // API client handles auth automatically
    const { friends } = useFriendRequests()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    // Get friends count
    const friendsCount = friends.length

    // Fetch user profile on mount
    useEffect(() => {
        fetchUserProfile()
    }, [])

    const fetchUserProfile = async () => {
        try {
            setIsLoading(true)
            setError(null)
            
            const result = await apiRequestJson<{ hasProfile?: boolean; profile?: any }>('check-profile', {
                method: 'GET'
            })

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

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen  p-4 max-w-md mx-auto">
                <div className="flex items-center mb-6 pt-4">
                    <button 
                        onClick={onBack}
                        className="mr-3 px-4 py-2.5 rounded-2xl backdrop-blur-xl bg-white/20 border border-white/30 shadow-lg hover:bg-white/30 active:scale-95 transition-all duration-200 text-white font-medium"
                    >
                        ← Back
                    </button>
                    <h1 className="text-2xl font-bold text-white">Profile</h1>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20 shadow-lg animate-pulse">
                            <div className="h-4 bg-white/20 rounded mb-2"></div>
                            <div className="h-3 bg-white/20 rounded w-3/4"></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen  p-4 max-w-md mx-auto">
                <div className="flex items-center mb-6 pt-4">
                    <button 
                        onClick={onBack}
                        className="mr-3 px-4 py-2.5 rounded-2xl backdrop-blur-xl bg-white/20 border border-white/30 shadow-lg hover:bg-white/30 active:scale-95 transition-all duration-200 text-white font-medium"
                    >
                        ← Back
                    </button>
                    <h1 className="text-2xl font-bold text-white">Profile</h1>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-center">
                    <p className="text-white mb-3">{error}</p>
                    <button 
                        onClick={fetchUserProfile}
                        className="bg-white text-purple-600 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
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
                <h1 className="text-2xl font-bold text-white">Profile</h1>
            </div>

            <div className="space-y-6">
                {/* Profile Header Card */}
                <Card className="p-6 text-center">
                    {/* Profile Picture */}
                    <div className="mb-4">
                        {profile?.profile_pic ? (
                            <Image 
                                src={profile.profile_pic} 
                                alt="Profile" 
                                className="w-24 h-24 rounded-full mx-auto"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto flex items-center justify-center">
                                <span className="text-2xl text-gray-400">👤</span>
                            </div>
                        )}
                    </div>

                    {/* Username and Display Name */}
                    <h2 className="text-xl font-bold mb-1">@{profile?.username}</h2>
                    <p className="text-gray-600 mb-2">{profile?.display_name}</p>
                    
                    {/* Bio */}
                    {profile?.bio && (
                        <p className="text-sm text-gray-700 mb-4">{profile.bio}</p>
                    )}

                    {/* Member Since */}
                    <p className="text-xs text-gray-500">
                        Member since {profile ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                    </p>
                </Card>

                {/* Style Preferences Card */}
                <Card className="p-5">
                    <h3 className="font-semibold mb-4">Style Preferences</h3>
                    {profile?.style_preferences && profile.style_preferences.length > 0 ? (
                        <div className="overflow-x-auto scrollbar-hide -mx-5 px-5">
                            <div className="flex gap-3 whitespace-nowrap">
                                {profile.style_preferences.map((preference, index) => (
                                    <span 
                                        key={index}
                                        className="px-3 py-1.5 bg-blue-100 text-blue-800 text-xs rounded-full flex-shrink-0"
                                    >
                                        {preference}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No style preferences set. Add some in Edit Profile!</p>
                    )}
                </Card>

                {/* Interests Card */}
                <Card className="p-5">
                    <h3 className="font-semibold mb-4">Interests</h3>
                    {profile?.interests && profile.interests.length > 0 ? (
                        <div className="overflow-x-auto scrollbar-hide -mx-5 px-5">
                            <div className="flex gap-3 whitespace-nowrap">
                                {profile.interests.map((interest, index) => (
                                    <span 
                                        key={index}
                                        className="px-3 py-1.5 bg-purple-100 text-purple-800 text-xs rounded-full flex-shrink-0"
                                    >
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No interests set. Add some in Edit Profile!</p>
                    )}
                </Card>

                {/* Profile Stats Card */}
                <Card className="p-5">
                    <h3 className="font-semibold mb-4">Profile Stats</h3>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-purple-600">{friendsCount}</p>
                        <p className="text-sm text-gray-600 mt-1">
                            {friendsCount === 1 ? 'Friend' : 'Friends'}
                        </p>
                    </div>
                </Card>

                {/* Edit Profile Button */}
                <Button 
                    onClick={onEdit}
                    className="w-full"
                >
                    Edit Profile
                </Button>
            </div>
        </div>
    )
}
