import { useState, useEffect } from 'react'
import { useCurrentUser, Button, Input, Card } from '@shopify/shop-minis-react'
import { useAuth } from '../../hooks/useAuth'

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

interface ProfileEditPageProps {
    onBack: () => void
    onSave: () => void
}

export function ProfileEditPage({ onBack, onSave }: ProfileEditPageProps) {
    const { currentUser } = useCurrentUser()
    const { getValidToken, clearAuth } = useAuth()
    const isDebugBuild = import.meta.env.MODE !== 'production'
    
    // Form state
    const [username, setUsername] = useState('')
    const [bio, setBio] = useState('')
    const [stylePreferences, setStylePreferences] = useState<string[]>([])
    const [interests, setInterests] = useState<string[]>([])
    const [customInterest, setCustomInterest] = useState('')
    const [activeBubbleIndex, setActiveBubbleIndex] = useState<number | null>(null)
    
    // UI state
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const styleOptions = [
        'Casual', 'Formal', 'Streetwear', 'Vintage', 'Minimalist', 
        'Bohemian', 'Athletic', 'Business', 'Trendy', 'Classic'
    ]
    
    const interestOptions = [
        'Fashion', 'Streetwear', 'Vintage', 'Luxury', 'Sustainable', 
        'Athletic', 'Formal', 'Accessories', 'Shoes', 'Jewelry',
        'Beauty', 'Lifestyle', 'Travel', 'Art', 'Music'
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
                    setStylePreferences(profile.style_preferences || [])
                    setInterests(profile.interests || [])
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // DEBUG ONLY: clears cached auth to force a fresh JWT. Remove before production.
    const handleDebugClearAuth = async () => {
        try {
            await clearAuth()
            alert('Auth cache cleared. Re-open any screen that requests data to re-authenticate.')
        } catch (error) {
            console.error('Error clearing auth cache:', error)
        }
    }

        const toggleStylePreference = (style: string) => {
        setStylePreferences(prev => 
            prev.includes(style) 
                ? prev.filter(s => s !== style)
                : [...prev, style]
        )
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
                style_preferences: stylePreferences,
                interests: interests,
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
            <div className="p-4 max-w-md mx-auto">
                <div className="flex items-center mb-6">
                    <button 
                        onClick={onBack}
                        className="mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        ← Back
                    </button>
                    <h1 className="text-2xl font-bold">Edit Profile</h1>
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

    return (
        <div className="p-4 max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center mb-6">
                <button 
                    onClick={onBack}
                    className="mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    ← Back
                </button>
                <h1 className="text-2xl font-bold">Edit Profile</h1>
                {isDebugBuild && (
                    <button
                        type="button"
                        onClick={handleDebugClearAuth}
                        className="ml-auto text-xs text-red-500 underline"
                    >
                        Clear Auth (Debug)
                    </button>
                )}
            </div>

            <Card className="p-6">
                <form onSubmit={handleSubmit}>
                    {/* Username Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Username *</label>
                        <Input
                            value={username}
                            readOnly
                            disabled
                            placeholder="your_username"
                            className="w-full"
                            aria-readonly="true"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Usernames are permanent. Contact support if you need to change it.
                        </p>
                    </div>
                    
                    {/* Bio Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Bio (optional)</label>
                        <Input
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about your style..."
                            className="w-full"
                        />
                    </div>
                    
                    {/* Style Preferences */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-3">Style Preferences</label>
                        <div className="grid grid-cols-2 gap-2">
                            {styleOptions.map((style) => (
                                <button
                                    key={style}
                                    type="button"
                                    onClick={() => toggleStylePreference(style)}
                                    className={`p-2 text-sm rounded-lg border transition-colors ${
                                        stylePreferences.includes(style)
                                            ? 'bg-blue-500 text-white border-blue-500'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Interests */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-3">Your Interests</label>
                        
                        {/* Bubble Interface */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {/* Existing Interest Bubbles */}
                            {interests.map((interest, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm border-2 border-blue-200"
                                >
                                    <span>{interest}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeInterest(interest)}
                                        className="text-blue-600 hover:text-blue-800 ml-1 font-bold"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            
                            {/* Active Input Bubble */}
                            {activeBubbleIndex !== null && (
                                <div className="bg-blue-50 border-2 border-blue-300 border-dashed px-3 py-2 rounded-full text-sm">
                                    <input
                                        type="text"
                                        value={customInterest}
                                        onChange={(e) => setCustomInterest(e.target.value)}
                                        onKeyDown={handleBubbleKeyPress}
                                        onBlur={handleBubbleBlur}
                                        placeholder="Type interest..."
                                        className="bg-transparent border-none outline-none text-blue-800 placeholder-blue-400 w-32"
                                        autoFocus
                                    />
                                </div>
                            )}
                            
                            {/* Add New Bubble Button */}
                            {activeBubbleIndex === null && (
                                <button
                                    type="button"
                                    onClick={startNewBubble}
                                    className="bg-gray-100 border-2 border-dashed border-gray-300 text-gray-500 px-3 py-2 rounded-full text-sm hover:bg-gray-200 hover:border-gray-400 transition-colors"
                                >
                                    + Add Interest
                                </button>
                            )}
                        </div>
                        
                        {/* Simple Quick Add Grid */}
                        <div>
                            <p className="text-sm text-gray-600 mb-4">Quick add:</p>
                            <div className="grid grid-cols-3 gap-3">
                                {interestOptions.map((interest) => {
                                    const isSelected = interests.includes(interest)
                                    
                                    return (
                                        <button
                                            key={interest}
                                            type="button"
                                            onClick={() => addQuickInterest(interest)}
                                            disabled={isSelected}
                                            className={`
                                                p-3 text-sm rounded-lg border transition-all duration-300 ease-out
                                                hover:scale-105 hover:shadow-lg
                                                active:scale-95
                                                ${isSelected 
                                                    ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed' 
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 shadow-md hover:shadow-lg cursor-pointer'
                                                }
                                            `}
                                        >
                                            {interest}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                    
                    {/* Error Display */}
                    {errors.general && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            {errors.general}
                        </div>
                    )}
                    
                    {/* Submit Button */}
                    <Button 
                        type="submit" 
                        className="w-full"
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </form>
            </Card>
        </div>
    )
}
