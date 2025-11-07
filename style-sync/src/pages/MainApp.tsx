/**
 * MainApp.tsx
 * 
 * Main application component that serves as the central hub for authenticated users.
 * This component manages navigation between different views and displays the user's
 * main dashboard with profile summary and friends management.
 * 
 * ## Development Structure Guide
 * 
 * When adding new features to MainApp, follow this structure:
 * 
 * ### 1. Add New View Type (if needed)
 * ```typescript
 * // Update the currentView type union
 * const [currentView, setCurrentView] = useState<
 *   'main' | 'friends' | 'profile' | 'profile-edit' | 'new-view'
 * >('main')
 * ```
 * 
 * ### 2. Import New Page Component
 * ```typescript
 * import { NewPage } from './path/to/NewPage'
 * ```
 * 
 * ### 3. Add View Rendering Logic
 * ```typescript
 * // Add before the main view return statement
 * if (currentView === 'new-view') {
 *   return (
 *     <NewPage 
 *       onBack={() => setCurrentView('main')} 
 *       // Add other props as needed
 *     />
 *   )
 * }
 * ```
 * 
 * ### 4. Add Navigation Button/Trigger
 * ```typescript
 * // In the main view JSX, add a button or card
 * <button onClick={() => setCurrentView('new-view')}>
 *   Go to New View
 * </button>
 * ```
 * 
 * ### 5. Add State Management (if needed)
 * ```typescript
 * // Add new state variables at the top of the component
 * const [newFeatureData, setNewFeatureData] = useState<Type | null>(null)
 * ```
 * 
 * ### 6. Add API Calls (if needed)
 * ```typescript
 * // Create async function similar to fetchUserProfile
 * const fetchNewFeature = async () => {
 *   try {
 *     const token = await getValidToken()
 *     // Make API call
 *   } catch (error) {
 *     // Handle error
 *   }
 * }
 * ```
 * 
 * ### 7. Add Loading/Error States (if needed)
 * ```typescript
 * // Add new loading/error states
 * const [isLoadingFeature, setIsLoadingFeature] = useState(false)
 * const [featureError, setFeatureError] = useState<string | null>(null)
 * ```
 * 
 * ## Navigation Pattern
 * 
 * This component uses state-based navigation (not MinisRouter). Each view is rendered
 * conditionally based on `currentView` state. Navigation is handled by:
 * - Setting `currentView` to the desired view name
 * - Passing `onBack` callbacks to child components
 * - Optionally passing data via props
 * 
 * ## Data Flow
 * 
 * 1. Component mounts → `useEffect` triggers `fetchUserProfile()`
 * 2. Profile data loaded → `profile` state updated
 * 3. User interacts → `setCurrentView()` changes view
 * 4. Child components render → Handle their own data fetching
 * 5. User navigates back → `onBack` callback sets view to 'main'
 * 
 * ## Future Considerations
 * 
 * - Consider migrating to MinisRouter for proper view transitions
 * - Add routing state management for deep linking
 * - Consider adding a navigation context/provider for cleaner state management
 */

import { useState, useEffect } from 'react'
import { useCurrentUser } from '@shopify/shop-minis-react'
import { FriendsPage } from './social/FriendsPage'
import { ProfilePage } from './user_profile/ProfilePage'
import { ProfileEditPage } from './user_profile/ProfileEditPage'
import { FeedPage } from './feeds/FeedPage'
import { useAuth } from '../hooks/useAuth'

/**
 * UserProfile interface
 * 
 * Represents a user's profile data fetched from the backend.
 * Matches the structure returned by the check-profile Edge Function.
 */
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

/**
 * MainApp Component
 * 
 * Main application hub that:
 * - Fetches and displays user profile data
 * - Manages navigation between different views/pages
 * - Provides the main dashboard with quick access to key features
 * 
 * @returns {JSX.Element} The main app component with conditional view rendering
 */
export function MainApp() {
    // ============================================
    // HOOKS & AUTHENTICATION
    // ============================================
    
    /** Current user from Shop Minis SDK - provides Shop user data */
    const { currentUser } = useCurrentUser()
    
    /** Auth hook - provides JWT token for API calls */
    const { getValidToken } = useAuth()

    // ============================================
    // STATE MANAGEMENT
    // ============================================
    
    /**
     * Current view/page being displayed.
     * Controls which component is rendered based on user navigation.
     */
    const [currentView, setCurrentView] = useState<'main' | 'friends' | 'profile' | 'profile-edit' | 'feeds'>('main')
    
    /**
     * User profile data fetched from backend.
     * Contains username, bio, interests, style preferences, etc.
     */
    const [profile, setProfile] = useState<UserProfile | null>(null)
    
    /**
     * Loading state for profile fetch operation.
     * Shows loading skeleton while fetching profile data.
     */
    const [isLoading, setIsLoading] = useState(true)
    
    /**
     * Error state for profile fetch operation.
     * Displays error message and retry button if fetch fails.
     */
    const [error, setError] = useState<string | null>(null)

    // ============================================
    // EFFECTS
    // ============================================
    
    /**
     * Fetch user profile on component mount.
     * Runs once when component first renders.
     */
    useEffect(() => {
        fetchUserProfile()
    }, [])

    // ============================================
    // API FUNCTIONS
    // ============================================
    
    /**
     * Fetches the current user's profile from the backend.
     * 
     * Flow:
     * 1. Get JWT token via useAuth hook
     * 2. Call check-profile Edge Function
     * 3. Update profile state with fetched data
     * 4. Handle errors and loading states
     * 
     * @throws {Error} If API call fails or returns non-OK status
     */
    const fetchUserProfile = async () => {
        try {
            // Reset states before API call
            setIsLoading(true)
            setError(null)
            
            // Get JWT token for authenticated API request
            const token = await getValidToken()
            
            // Call check-profile Edge Function to fetch user profile
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

            // Handle API errors
            if (!response.ok) {
                throw new Error(`Failed to fetch profile: ${response.status}`)
            }

            // Parse response and update profile state
            const result = await response.json()
            if (result.hasProfile && result.profile) {
                setProfile(result.profile)
            } else {
                // Profile doesn't exist (shouldn't happen if user completed onboarding)
                setError('No profile found')
            }
        } catch (error) {
            // Log error for debugging
            console.error('Error fetching profile:', error)
            // Set user-friendly error message
            setError(error instanceof Error ? error.message : 'Failed to load profile')
        } finally {
            // Always stop loading indicator
            setIsLoading(false)
        }
    }

    // ============================================
    // CONDITIONAL VIEW RENDERING
    // ============================================
    // Each view is rendered based on currentView state.
    // Views are checked in order - first match wins.
    // Main view is rendered last if no other view matches.
    
    /**
     * Friends Page View
     * Displays friend requests, sent requests, and friends list.
     */
    if (currentView === 'friends') {
        return <FriendsPage onBack={() => setCurrentView('main')} />
    }

    /**
     * Profile View View
     * Displays user's full profile with edit option.
     */
    if (currentView === 'profile') {
        return (
            <ProfilePage 
                onBack={() => setCurrentView('main')} 
                onEdit={() => setCurrentView('profile-edit')}
            />
        )
    }

    /**
     * Profile Edit View
     * Allows user to edit profile information.
     * Refreshes profile data after saving.
     */
    if (currentView === 'profile-edit') {
        return (
            <ProfileEditPage 
                onBack={() => setCurrentView('profile')} 
                onSave={() => {
                    setCurrentView('profile')
                    // Refresh profile data after saving to show updated info
                    fetchUserProfile()
                }}
            />
        )
    }
    /**
     * Feeds Page View
     * Displays the pages of the people users follow so they can see their style.
     */
    if (currentView === 'feeds') {
        return <FeedPage onBack={() => setCurrentView('main')} />
    }


    // ============================================
    // MAIN VIEW STATES
    // ============================================
    
    /**
     * Loading State
     * Shows skeleton loading UI while profile data is being fetched.
     */
    if (isLoading) {
        return (
            <div className="p-4 max-w-md mx-auto">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold mb-2">Style$ync</h1>
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

    /**
     * Error State
     * Displays error message with retry button if profile fetch fails.
     */
    if (error) {
        return (
            <div className="p-4 max-w-md mx-auto">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold mb-2">Style$ync</h1>
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

    // ============================================
    // MAIN DASHBOARD VIEW
    // ============================================
    // This is the default view shown when no other view is active.
    // Displays profile summary, quick access cards, and navigation buttons.
    
    return (
        <div className="p-4 max-w-md mx-auto">
            {/* Page Header */}
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">Style$ync</h1>
                <p className="text-gray-600">Welcome back, {currentUser?.displayName || 'User'}!</p>
            </div>

            <div className="space-y-4">
                {/* Profile Card - Shows user's profile summary */}
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

                {/* Style Preferences Card - Displays user's selected style preferences */}
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h2 className="font-semibold mb-2">Style Preferences</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {profile?.style_preferences && profile.style_preferences.length > 0 ? (
                            // Display each preference as a blue pill badge
                            profile.style_preferences.map((preference, index) => (
                                <span 
                                    key={index}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                >
                                    {preference}
                                </span>
                            ))
                        ) : (
                            // Show placeholder if no preferences set
                            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                                No preferences set
                            </span>
                        )}
                    </div>
                </div>

                {/* Interests Card - Displays user's interests (only shown if interests exist) */}
                {profile?.interests && profile.interests.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <h2 className="font-semibold mb-2">Your Interests</h2>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {/* Display each interest as a purple pill badge */}
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

                {/* Feeds Card - Quick access to feeds */}
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h2 className="font-semibold mb-2">Feeds</h2>
                    <p className="text-sm text-gray-600 mb-3">See your friends' style!</p>
                    <button 
                        onClick={() => setCurrentView('feeds')}
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        View Feeds
                    </button>
                </div>

                {/* Friends Card - Quick access to friends management */}
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
