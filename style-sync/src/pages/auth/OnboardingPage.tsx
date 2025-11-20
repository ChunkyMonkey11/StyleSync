import { useState } from 'react'
import { useCurrentUser, Button, Input, Card, Image } from '@shopify/shop-minis-react'
import { useAuth } from '../../hooks/useAuth'

interface OnboardingPageProps {
    onComplete: () => void
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
    const { currentUser, loading } = useCurrentUser()
    const { getValidToken } = useAuth()
    const [username, setUsername] = useState('')
    const [bio, setBio] = useState('')
    const [stylePreferences, setStylePreferences] = useState<string[]>([])
    const [interests, setInterests] = useState<string[]>([])
    const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'NEUTRAL' | ''>('')
    const [customInterest, setCustomInterest] = useState('')
    const [activeBubbleIndex, setActiveBubbleIndex] = useState<number | null>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    const styleOptions = [
        'Casual', 'Formal', 'Streetwear', 'Vintage', 'Minimalist', 
        'Bohemian', 'Athletic', 'Business', 'Trendy', 'Classic'
    ]
    
    const interestOptions = [
        'Fashion', 'Streetwear', 'Vintage', 'Luxury', 'Sustainable', 
        'Athletic', 'Formal', 'Accessories', 'Shoes', 'Jewelry',
        'Beauty', 'Lifestyle', 'Travel', 'Art', 'Music'
    ]
    
    const validateUsername = (value: string) => {
        if (!value) return 'Username is required'
        if (value.length < 3) return 'Username must be at least 3 characters'
        if (!/^[a-z0-9_]+$/.test(value)) return 'Only lowercase letters, numbers, and underscores'
        return null
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
                style_preferences: stylePreferences,
                interests: interests,
                gender: gender || undefined,
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
            <div className="flex items-center justify-center min-h-screen p-4">
                <p className="text-lg">Loading user data...</p>
            </div>
        )
    }
    
    return (
        <div className="p-4 max-w-md mx-auto">
            <Card className="p-6">
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold mb-2">Welcome to Style$ync</h1>
                        <p className="text-gray-600">Let's set up your style profile</p>
                    </div>
                    
                    {/* User Info Display */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                            {currentUser?.avatarImage?.url && (
                                <Image 
                                    src={currentUser.avatarImage.url} 
                                    alt="Profile" 
                                    className="w-12 h-12 rounded-full"
                                />
                            )}
                            <div>
                                <p className="font-medium">{currentUser?.displayName || 'User'}</p>
                                <p className="text-sm text-gray-500">Connected via Shop</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Username Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Username *</label>
                        <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="your_username"
                            className="w-full"
                            aria-invalid={!!errors.username}
                        />
                        {errors.username && (
                            <p className="text-sm text-red-600 mt-1">{errors.username}</p>
                        )}
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

                    {/* Gender */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-3">Gender (optional)</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['MALE','FEMALE','NEUTRAL'] as const).map(g => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setGender(g)}
                                    className={`p-2 text-sm rounded-lg border transition-colors ${
                                        gender === g
                                            ? 'bg-purple-600 text-white border-purple-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {g === 'MALE' ? 'Male' : g === 'FEMALE' ? 'Female' : 'Non-binary'}
                                </button>
                            ))}
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
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating Profile...' : 'Complete Setup'}
                    </Button>
                </form>
            </Card>
            
            {/* Custom CSS Animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes waterfall {
                        0% {
                            transform: translateY(0%) scale(0.9);
                            opacity: 0;
                        }
                        10% {
                            opacity: 1;
                        }
                        90% {
                            opacity: 1;
                        }
                        100% {
                            transform: translateY(-200%) scale(0.9);
                            opacity: 0;
                        }
                    }
                    
                    @keyframes drift {
                        0%, 100% { transform: translateX(0px); }
                        25% { transform: translateX(-8px); }
                        50% { transform: translateX(6px); }
                        75% { transform: translateX(-4px); }
                    }
                    
                    @keyframes float {
                        0%, 100% { transform: translateY(0px) rotate(0deg); }
                        25% { transform: translateY(-8px) rotate(1deg); }
                        50% { transform: translateY(-4px) rotate(-1deg); }
                        75% { transform: translateY(-12px) rotate(0.5deg); }
                    }
                    
                    @keyframes bubblePop {
                        0% { transform: scale(1) rotate(0deg); }
                        50% { transform: scale(1.3) rotate(180deg); }
                        100% { transform: scale(1) rotate(360deg); }
                    }
                    
                    .animate-waterfall {
                        animation: waterfall 6s linear infinite;
                    }
                    
                    .animate-float {
                        animation: float 6s ease-in-out infinite;
                    }
                    
                    .animate-bubble-pop {
                        animation: bubblePop 0.6s ease-out;
                    }
                    
                    .bubble-hover:hover {
                        animation-play-state: paused;
                        transform: translateY(-4px) scale(1.05);
                    }
                `
            }} />
        </div>
    )
}