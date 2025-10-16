import { useState } from 'react'
import { useCurrentUser, Button, Input, Card, Image ,useGenerateUserToken} from '@shopify/shop-minis-react'
import { supabase } from '../lib/supabase'

// UserProfile interface for future use
// interface UserProfile {
//     id: string
//     shop_public_id: string
//     username: string
//     display_name: string
//     profile_pic?: string
//     bio?: string
//     interests?: string[]
//     style_preferences?: string[]
//     created_at: string
//     updated_at?: string
// }

interface OnboardingPageProps {
    onComplete: () => void
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
    const { currentUser, loading } = useCurrentUser()
    const { generateUserToken } = useGenerateUserToken()  // Add this line
    const [username, setUsername] = useState('')
    const [bio, setBio] = useState('')
    const [stylePreferences, setStylePreferences] = useState<string[]>([])
    const [interests, setInterests] = useState<string[]>([])
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
    
    const toggleInterest = (interest: string) => {
        setInterests(prev => 
            prev.includes(interest) 
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        )
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
            // Generate Shop user token
            const { data } = await generateUserToken()
            const { token } = data
            
            if (token) {
                console.log('Generated token:', token)
                // TODO: Send to your backend for verification
                
                const profileData = {
                    username: username.toLowerCase(),
                    display_name: currentUser?.displayName || username,
                    profile_pic: currentUser?.avatarImage?.url || '',
                    bio: bio.trim(),
                    style_preferences: stylePreferences,
                    shop_token: token // Temporary - you'll verify this on backend
                }
                
                console.log('Profile data:', profileData)
                
                // Save to Supabase
                const { data: savedProfile, error } = await supabase
                    .from('userprofiles')
                    .insert([{
                        shop_public_id: 'temp_' + Date.now(),
                        username: username.toLowerCase(),
                        display_name: currentUser?.displayName || username,
                        profile_pic: currentUser?.avatarImage?.url || '',
                        bio: bio.trim(),
                        style_preferences: stylePreferences,
                        interests: interests
                    }])
                    .select()

                if (error) {
                    throw error
                }

                console.log('Profile saved:', savedProfile)
                alert('Profile created successfully!')
                onComplete() // Navigate to main app 
            }
        } catch (error) {
            console.error('Error:', error)
            setErrors({ general: 'Failed to create profile. Please try again.' })
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
                        <h1 className="text-2xl font-bold mb-2">Welcome to StyleSync</h1>
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
                        <label className="block text-sm font-medium mb-3">Interests (for product recommendations)</label>
                        <div className="grid grid-cols-2 gap-2">
                            {interestOptions.map((interest) => (
                                <button
                                    key={interest}
                                    type="button"
                                    onClick={() => toggleInterest(interest)}
                                    className={`p-2 text-sm rounded-lg border transition-colors ${
                                        interests.includes(interest)
                                            ? 'bg-green-500 text-white border-green-500'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {interest}
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
        </div>
    )
}