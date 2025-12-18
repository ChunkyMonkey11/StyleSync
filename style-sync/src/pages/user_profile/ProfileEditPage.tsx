import { useState, useEffect } from 'react'
import { useCurrentUser, Button, Input, Card } from '@shopify/shop-minis-react'
import { useAuth } from '../../hooks/useAuth'

interface ProfileEditPageProps {
    onBack: () => void
    onSave: () => void
}

export function ProfileEditPage({ onBack, onSave }: ProfileEditPageProps) {
    const { currentUser } = useCurrentUser()
    const { getValidToken } = useAuth()
    
    // Form state
    const [username, setUsername] = useState('')
    const [bio, setBio] = useState('')
    const [interests, setInterests] = useState<string[]>([])
    const [customInterest, setCustomInterest] = useState('')
    const [activeBubbleIndex, setActiveBubbleIndex] = useState<number | null>(null)
    const [isPublic, setIsPublic] = useState(true)
    
    // UI state
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [showAllInterests, setShowAllInterests] = useState(false)
    
    const interestOptions = [
        'Fashion', 'Streetwear', 'Vintage', 'Luxury', 'Sustainable', 
        'Athletic', 'Formal', 'Accessories', 'Shoes', 'Jewelry',
        'Beauty', 'Lifestyle', 'Travel', 'Art', 'Music',
        'Urban', 'Sneakers', 'Comfort', 'Everyday', 'Designer', 
        'Premium', 'Retro', 'Thrift'
    ]

    // Load existing profile data
    useEffect(() => {
        loadProfileData()
    }, [])

    const loadProfileData = async () => {
        try {
            setIsLoading(true)
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

            if (response.ok) {
                const result = await response.json()
                if (result.hasProfile && result.profile) {
                    const profile = result.profile
                    setUsername(profile.username || '')
                    setBio(profile.bio || '')
                    setInterests(profile.interests || [])
                    setIsPublic(profile.is_public ?? true)
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const removeInterest = (interestToRemove: string) => {
        setInterests(prev => prev.filter(interest => interest !== interestToRemove))
    }
    
    const startNewBubble = () => {
        setActiveBubbleIndex(interests.length)
        setCustomInterest('')
    }
    
    const handleBubbleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            if (customInterest.trim() && !interests.includes(customInterest.trim())) {
                setInterests(prev => [...prev, customInterest.trim()])
                setCustomInterest('')
                setActiveBubbleIndex(null)
            }
        }
        if (e.key === 'Escape') {
            setActiveBubbleIndex(null)
            setCustomInterest('')
        }
    }
    
    const handleBubbleBlur = () => {
        if (customInterest.trim() && !interests.includes(customInterest.trim())) {
            setInterests(prev => [...prev, customInterest.trim()])
        }
        setActiveBubbleIndex(null)
        setCustomInterest('')
    }
    
    const addQuickInterest = (interest: string) => {
        if (!interests.includes(interest)) {
            setInterests(prev => [...prev, interest])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        setIsSaving(true)
        setErrors({})
        
        try {
            const token = await getValidToken()
            
            // Prepare profile data
            const profileData = {
                username: username.toLowerCase(),
                display_name: currentUser?.displayName || username,
                profile_pic: currentUser?.avatarImage?.url || '',
                bio: bio.trim() || undefined,
                interests: interests,
                is_public: isPublic,
                updated_at: new Date().toISOString()
            }
            
            console.log('Updating profile with data:', profileData)
            
            // Call create-profile Edge Function (it handles both create and update)
            const response = await fetch(
                'https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/create-profile',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ profileData })
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to update profile')
            }

            const result = await response.json()
            console.log('Profile updated:', result.profile)
            
            onSave() // Navigate back to profile page
            
        } catch (error) {
            console.error('Error updating profile:', error)
            setErrors({ general: error instanceof Error ? error.message : 'Failed to update profile. Please try again.' })
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 p-4 max-w-md mx-auto">
                <div className="flex items-center mb-8 pt-4">
                    <button 
                        onClick={onBack}
                        className="mr-3 px-4 py-2.5 rounded-2xl backdrop-blur-xl bg-white/20 border border-white/30 shadow-lg hover:bg-white/30 active:scale-95 transition-all duration-200 text-white font-medium"
                    >
                        ← Back
                    </button>
                    <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="space-y-8">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="animate-pulse">
                                <div className="h-4 bg-gray-200 rounded mb-2 w-1/3"></div>
                                <div className="h-10 bg-gray-200 rounded w-full"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // Cap interests at 7 for better focus
    const MAX_INTERESTS = 7
    const canAddMore = interests.length < MAX_INTERESTS

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 p-4 max-w-md mx-auto">
            {/* Header - Simple and utilitarian */}
            <div className="flex items-center mb-8 pt-4">
                <button 
                    onClick={onBack}
                    className="mr-3 px-4 py-2.5 rounded-2xl backdrop-blur-xl bg-white/20 border border-white/30 shadow-lg hover:bg-white/30 active:scale-95 transition-all duration-200 text-white font-medium"
                >
                    ← Back
                </button>
                <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Username - Read-only display */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Username
                        </label>
                        <div className="flex items-center gap-2 text-gray-900">
                            <span className="text-base">@{username}</span>
                            <span className="text-gray-400">🔒</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Usernames are permanent
                        </p>
                    </div>
                    
                    {/* Bio - More expressive */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bio <span className="text-gray-500 font-normal">(optional)</span>
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="What's your style, vibe, or obsession?"
                            rows={3}
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
                        />
                    </div>
                    
                    {/* Interests - Simplified and focused */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Interests
                            </label>
                            {interests.length > 0 && (
                                <span className="text-xs text-gray-500">
                                    {interests.length}/{MAX_INTERESTS}
                                </span>
                            )}
                        </div>
                        
                        {/* Selected Interests - Primary focus */}
                        {interests.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {interests.map((interest, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-1.5 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium"
                                    >
                                        <span>{interest}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeInterest(interest)}
                                            className="ml-0.5 text-purple-500 hover:text-purple-700 font-medium"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Add Custom - Inline button */}
                        {canAddMore && activeBubbleIndex === null && (
                            <button
                                type="button"
                                onClick={startNewBubble}
                                className="text-sm text-purple-600 hover:text-purple-700 font-medium mb-4"
                            >
                                + Custom
                            </button>
                        )}
                        
                        {/* Active Custom Input */}
                        {activeBubbleIndex !== null && (
                            <div className="mb-4">
                                <input
                                    type="text"
                                    value={customInterest}
                                    onChange={(e) => setCustomInterest(e.target.value)}
                                    onKeyDown={handleBubbleKeyPress}
                                    onBlur={handleBubbleBlur}
                                    placeholder="Type and press Enter..."
                                    className="w-full bg-white border border-purple-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    autoFocus
                                />
                            </div>
                        )}
                        
                        {/* Quick Add - Progressive disclosure */}
                        {canAddMore && (
                            <div>
                                <p className="text-xs text-gray-600 mb-3">Quick add</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {(showAllInterests ? interestOptions : interestOptions.slice(0, 9)).map((interest) => {
                                        const isSelected = interests.includes(interest)
                                        
                                        return (
                                            <button
                                                key={interest}
                                                type="button"
                                                onClick={() => addQuickInterest(interest)}
                                                disabled={isSelected || !canAddMore}
                                                className={`
                                                    p-2.5 text-xs rounded-lg border transition-colors
                                                    ${isSelected 
                                                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                                                        : 'bg-white text-gray-700 border-gray-200 hover:border-purple-500 hover:text-purple-700'
                                                    }
                                                `}
                                            >
                                                {interest}
                                            </button>
                                        )
                                    })}
                                </div>
                                {interestOptions.length > 9 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAllInterests(!showAllInterests)}
                                        disabled={!canAddMore}
                                        className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {showAllInterests 
                                            ? 'Show less' 
                                            : `+ ${interestOptions.length - 9} more`
                                        }
                                    </button>
                                )}
                            </div>
                        )}
                        
                        {!canAddMore && (
                            <p className="text-xs text-gray-500">
                                Maximum {MAX_INTERESTS} interests. Remove one to add another.
                            </p>
                        )}
                    </div>

                    {/* Profile Visibility - Simplified */}
                    <div className="pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700 mb-1">Public Profile</p>
                                <p className="text-xs text-gray-500">
                                    {isPublic 
                                        ? 'People can find and follow you'
                                        : 'Only discoverable via username search'
                                    }
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsPublic(!isPublic)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                                    isPublic ? 'bg-purple-600' : 'bg-gray-300'
                                }`}
                                role="switch"
                                aria-checked={isPublic}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        isPublic ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                    
                    {/* Error Display */}
                    {errors.general && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {errors.general}
                        </div>
                    )}
                    
                    {/* Submit Button - Primary action only */}
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    )
}
