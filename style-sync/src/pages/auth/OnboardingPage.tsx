import { useState } from 'react'
import { useCurrentUser, Image, Input } from '@shopify/shop-minis-react'
import { useAuth } from '../../hooks/useAuth'

interface OnboardingPageProps {
    onComplete: () => void
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
    const { currentUser, loading } = useCurrentUser()
    const { getValidToken } = useAuth()
    const [username, setUsername] = useState('')
    const [bio, setBio] = useState('')
    const [interests, setInterests] = useState<string[]>([])
    const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'NEUTRAL' | ''>('')
    const [customInterest, setCustomInterest] = useState('')
    const [activeBubbleIndex, setActiveBubbleIndex] = useState<number | null>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isPublic, setIsPublic] = useState(true)
    const [showAllInterests, setShowAllInterests] = useState(false)
    
    const MAX_INTERESTS = 7
    const canAddMore = interests.length < MAX_INTERESTS
    
    const interestOptions = [
        'Fashion', 'Streetwear', 'Vintage', 'Luxury', 'Sustainable', 
        'Athletic', 'Formal', 'Accessories', 'Shoes', 'Jewelry',
        'Beauty', 'Lifestyle', 'Travel', 'Art', 'Music',
        'Urban', 'Sneakers', 'Comfort', 'Everyday', 'Designer', 
        'Premium', 'Retro', 'Thrift'
    ]
    
    const validateUsername = (value: string) => {
        if (!value) return 'Username is required'
        if (value.length < 3) return 'Username must be at least 3 characters'
        if (!/^[a-z0-9_]+$/.test(value)) return 'Only lowercase letters, numbers, and underscores'
        return null
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
        if (!interests.includes(interest) && interests.length < MAX_INTERESTS) {
            setInterests(prev => [...prev, interest])
        }
    }
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        const usernameError = validateUsername(username)
        if (usernameError) {
            setErrors({ username: usernameError })
            return
        }
        
        setIsSubmitting(true)
        
        try {
            // Get JWT token for authentication
            const token = await getValidToken()
            
            // Prepare profile data
            // Note: We don't send id or shop_public_id - Edge Function handles these
            const profileData = {
                username: username.toLowerCase(),
                display_name: currentUser?.displayName || username,
                profile_pic: currentUser?.avatarImage?.url || '',
                bio: bio.trim() || undefined,
                interests: interests,
                gender: gender || undefined,
                is_public: isPublic,
                created_at: new Date().toISOString()
            }
            
            console.log('Creating profile with data:', profileData)
            
            // Call create-profile Edge Function
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
                throw new Error(errorData.error || 'Failed to create profile')
            }

            const result = await response.json()
            console.log('Profile created:', result.profile)
            
            alert('Profile created successfully!')
            onComplete() // Navigate to main app
            
        } catch (error) {
            console.error('Error:', error)
            setErrors({ general: error instanceof Error ? error.message : 'Failed to create profile. Please try again.' })
        } finally {
            setIsSubmitting(false)
        }
    }
    
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-white mb-2">StyleSync</h1>
                    <p className="text-white/80">Loading your profile...</p>
                </div>
            </div>
        )
    }
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 p-4 max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Header - Friendly and welcoming */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to StyleSync</h1>
                        <p className="text-gray-600 text-sm">Let's set up your profile</p>
                    </div>
                    
                    {/* User Info Display - Simple */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center space-x-3">
                            {currentUser?.avatarImage?.url ? (
                                <Image 
                                    src={currentUser.avatarImage.url} 
                                    alt="Profile" 
                                    className="w-12 h-12 rounded-full"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                                    <span className="text-white text-lg font-bold">
                                        {(currentUser?.displayName || 'U')[0]?.toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <div>
                                <p className="font-medium text-gray-900">{currentUser?.displayName || 'User'}</p>
                                <p className="text-xs text-gray-500">Connected via Shop</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Username Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Username <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="your_username"
                            className={`w-full bg-white border rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-1 transition-colors ${
                                errors.username ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'
                            }`}
                            aria-invalid={!!errors.username}
                        />
                        {errors.username && (
                            <p className="text-sm text-red-600 mt-1">{errors.username}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Lowercase letters, numbers, and underscores only</p>
                    </div>
                    
                    {/* Bio Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bio <span className="text-gray-500 font-normal">(optional)</span>
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="What's your style, vibe, or obsession?"
                            rows={3}
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition-colors resize-none"
                        />
                    </div>
                    
                    {/* Interests */}
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
                        
                        {/* Selected Interests */}
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
                        
                        {/* Add Custom - Simple inline */}
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
                                    className="w-full bg-white border border-purple-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
                                    autoFocus
                                />
                            </div>
                        )}
                        
                        {/* Quick Add - Show fewer initially */}
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

                    {/* Gender - Optional, simple */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Gender <span className="text-gray-500 font-normal">(optional)</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['MALE','FEMALE','NEUTRAL'] as const).map(g => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setGender(g)}
                                    className={`p-2.5 text-sm rounded-lg border transition-colors ${
                                        gender === g
                                            ? 'bg-purple-600 text-white border-purple-600'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
                                    }`}
                                >
                                    {g === 'MALE' ? 'Male' : g === 'FEMALE' ? 'Female' : 'Non-binary'}
                                </button>
                            ))}
                        </div>
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
                    
                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Creating Profile...' : 'Complete Setup'}
                    </button>
                </form>
            </div>
        </div>
    )
}