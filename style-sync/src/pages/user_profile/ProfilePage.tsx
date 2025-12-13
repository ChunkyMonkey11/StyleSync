import { useState, useEffect } from 'react'
import { Button } from '@shopify/shop-minis-react'
import { useAuth } from '../../hooks/useAuth'
import { useFriendRequests } from '../../hooks/useFriendRequests'
import { apiRequestJson } from '../../utils/apiClient'
import { getCardProfile, type CardProfileResponse } from '../../utils/api/card'
import { PokerCardPreview } from '../../components/PokerCardPreview'
import { SUIT_ICONS } from '../../types/card'

interface UserProfile {
    id: string
    shop_public_id: string
    username: string
    display_name: string
    profile_pic: string
    bio: string
    interests: string[]
    created_at: string
    updated_at: string
}

interface ProfilePageProps {
    onBack: () => void
    onEdit: () => void
    onDeckGuide?: () => void
}

export function ProfilePage({ onBack, onEdit, onDeckGuide }: ProfilePageProps) {
    const {} = useAuth() // API client handles auth automatically
    const { refreshData } = useFriendRequests()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [cardProfile, setCardProfile] = useState<CardProfileResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    // Fetch user profile and card profile data on mount
    useEffect(() => {
        fetchUserProfile()
        fetchCardProfile()
        refreshData() // Load friends data
    }, [refreshData])

    const fetchUserProfile = async () => {
        try {
            const result = await apiRequestJson<{ hasProfile?: boolean; profile?: any }>('check-profile', {
                method: 'GET'
            })

            if (result.hasProfile && result.profile) {
                setProfile(result.profile)
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
        }
    }

    const fetchCardProfile = async () => {
        try {
            setIsLoading(true)
            setError(null)
            
            const cardData = await getCardProfile()
            setCardProfile(cardData)
            
            // Also fetch regular profile for interests
            const result = await apiRequestJson<{ hasProfile?: boolean; profile?: any }>('check-profile', {
                method: 'GET'
            })
            if (result.hasProfile && result.profile) {
                setProfile(result.profile)
            }
        } catch (error) {
            console.error('Error fetching card profile:', error)
            setError(error instanceof Error ? error.message : 'Failed to load card profile')
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
        <div className="min-h-screen p-4 max-w-md mx-auto">
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
                {/* Poker Card Preview */}
                {cardProfile && profile && (
                    <div className="flex flex-col items-center">
                        <PokerCardPreview
                            username={cardProfile.username}
                            displayName={cardProfile.display_name}
                            avatarUrl={cardProfile.avatar_url}
                            bio={cardProfile.bio}
                            rank={cardProfile.rank}
                            suit={cardProfile.suit}
                            stats={{
                                friends_count: cardProfile.friends_count,
                                interests: profile.interests || []
                            }}
                        />
                        
                        {/* Current Tier Chip */}
                        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                            <span className="text-white font-semibold">
                                Current Tier: {cardProfile.rank}{SUIT_ICONS[cardProfile.suit]}
                                    </span>
                        </div>
                    </div>
                )}

                {/* Deck Guide Button */}
                {onDeckGuide && (
                    <Button 
                        onClick={onDeckGuide}
                        className="w-full"
                        variant="secondary"
                    >
                        View Deck Guide
                    </Button>
                )}

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
