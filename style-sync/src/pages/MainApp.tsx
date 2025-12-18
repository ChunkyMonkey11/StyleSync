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
import { FriendFeedPage } from './feeds/FriendFeedPage'
import { DeckGuidePage } from './deck/DeckGuidePage'
import { FriendCard } from '../types/card'
import { useAuth } from '../hooks/useAuth'
import { useFriendRequests } from '../hooks/useFriendRequests'
import { FeedsDeckButton } from '../components/FeedsDeckButton'
import { DealingOverlay } from '../components/DealingOverlay'
import pencilIcon from '../pencil.png'
import friendsIcon from '../Friends-icon.svg'

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
    is_public?: boolean
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
    
    /** Friends hook - provides friends list and count */
    const { receivedRequests, refreshData } = useFriendRequests()

    // Refresh friend requests data on mount to get latest count
    useEffect(() => {
        refreshData()
    }, [refreshData])

    // ============================================
    // STATE MANAGEMENT
    // ============================================
    
    /**
     * Current view/page being displayed.
     * Controls which component is rendered based on user navigation.
     */
    const [currentView, setCurrentView] = useState<'main' | 'friends' | 'profile' | 'profile-edit' | 'feeds' | 'deck-guide' | 'friend-feed'>('main')
    
    /**
     * Selected friend for viewing their feed
     */
    const [selectedFriend, setSelectedFriend] = useState<FriendCard | null>(null)
    
    /**
     * User profile data fetched from backend.
     * Contains username, bio, interests, etc.
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
    
    /**
     * Feeds deck state
     */
    const [isDeckOpening, setIsDeckOpening] = useState(false)
    const [showDealingOverlay, setShowDealingOverlay] = useState(false)
    const [deckButtonPosition, setDeckButtonPosition] = useState<{ x: number; y: number } | undefined>(undefined)
    

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

    /**
     * Refresh friend requests data on mount to get latest count for badge.
     */
    useEffect(() => {
        refreshData()
    }, [refreshData])
    

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
    // HERO SECTION HANDLERS
    // ============================================
    
    /**
     * Handles edit profile button click.
     * Navigates to profile-edit page.
     */
    const handleEditProfile = () => {
        setCurrentView('profile-edit')
    }
    
    /**
     * Gets profile picture URL with fallback.
     */
    const getProfilePicture = () => {
        if (profile?.profile_pic) {
            return profile.profile_pic
        }
        if (currentUser?.avatarImage?.url) {
            return currentUser.avatarImage.url
        }
        return null
    }

    /**
     * Handles deck button tap: shows dealing overlay animation
     */
    const handleDeckOpen = async () => {
        try {
            setIsDeckOpening(true)
            
            // Get the deck button's position immediately
            const deckButton = document.querySelector('[aria-label="Open Feeds Deck"]') as HTMLElement
            if (deckButton) {
                const rect = deckButton.getBoundingClientRect()
                setDeckButtonPosition({
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                })
            }
            
            // Show overlay immediately - no delay
            setIsDeckOpening(false)
            setShowDealingOverlay(true)
        } catch (err) {
            console.error('Error opening deck:', err)
            setIsDeckOpening(false)
            // On error, just navigate to feeds directly
            setCurrentView('feeds')
        }
    }

    /**
     * Handles dealing overlay finish: navigates to feeds
     */
    const handleDealingFinish = () => {
        setIsDeckOpening(false)
        setShowDealingOverlay(false)
        setDeckButtonPosition(undefined)
        setCurrentView('feeds')
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
                onDeckGuide={() => setCurrentView('deck-guide')}
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
                onBack={() => setCurrentView('main')} 
                onSave={() => {
                    setCurrentView('main')
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
        return (
            <FeedPage 
                onBack={() => setCurrentView('main')}
                onFriendClick={(friendCard) => {
                    setSelectedFriend(friendCard)
                    setCurrentView('friend-feed')
                }}
            />
        )
    }

    /**
     * Friend Feed Page View
     * Displays a specific friend's profile and product feed.
     */
    if (currentView === 'friend-feed' && selectedFriend) {
        return (
            <FriendFeedPage
                friendCard={selectedFriend}
                onBack={() => {
                    setCurrentView('feeds')
                    setSelectedFriend(null)
                }}
            />
        )
    }

    /**
     * Deck Guide View
     * Displays card ranking system and user's current card.
     */
    if (currentView === 'deck-guide') {
        return <DeckGuidePage onBack={() => setCurrentView('profile')} />
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
            <div className="min-h-screen p-4 max-w-md mx-auto">
                <div className="text-center mb-6 pt-4">
                    <h1 className="text-2xl font-bold mb-2 text-white">Style$ync</h1>
                    <p className="text-white/80">Loading your profile...</p>
                </div>
                
                {/* Hero Section Skeleton */}
                <div className="mb-8">
                    <div className="flex flex-col items-center">
                        <div className="w-[135px] h-[135px] rounded-full border-4 border-white/30 bg-white/10 animate-pulse mb-4"></div>
                        <div className="h-6 w-32 bg-white/10 rounded animate-pulse mb-2"></div>
                        <div className="h-4 w-24 bg-white/10 rounded animate-pulse"></div>
                    </div>
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

    /**
     * Error State
     * Displays error message with retry button if profile fetch fails.
     */
    if (error) {
        return (
            <div className="min-h-screen p-4 max-w-md mx-auto">
                {/* Premium Logo Header */}
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

    // ============================================
    // MAIN DASHBOARD VIEW
    // ============================================
    // This is the default view shown when no other view is active.
    // Displays profile summary, quick access cards, and navigation buttons.
    
    return (
        <>
            {/* Dealing Overlay */}
            {showDealingOverlay && (
                <DealingOverlay
                    onFinish={handleDealingFinish}
                    deckButtonPosition={deckButtonPosition}
                />
            )}

            {/* Hide main view when overlay is active to prevent flash */}
            <div className="min-h-screen p-4 max-w-md mx-auto" style={{
                opacity: showDealingOverlay ? 0 : 1,
                pointerEvents: showDealingOverlay ? 'none' : 'auto',
                transition: 'opacity 200ms ease-out'
            }}>
                {/* Profile Picture at Top (where logo was) */}
                <div className="w-full flex flex-col items-center mb-8" style={{ paddingTop: 'max(env(safe-area-inset-top, 1rem), 1rem)', paddingBottom: '1rem' }}>
                    <div className="relative">
                        <button
                            onClick={() => setCurrentView('profile')}
                            className="w-[135px] h-[135px] rounded-full border-4 border-white/30 shadow-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                            aria-label="View Profile"
                        >
                            {getProfilePicture() ? (
                                <img
                                    src={getProfilePicture()!}
                                    alt={profile?.username || 'Profile'}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-purple-500 flex items-center justify-center">
                                    <span className="text-white text-4xl font-bold">
                                        {profile?.username?.[0]?.toUpperCase() || currentUser?.displayName?.[0]?.toUpperCase() || 'U'}
                                    </span>
                                </div>
                            )}
                        </button>
                        
                        {/* Edit Pencil Icon - Positioned outside/on top of the border */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleEditProfile()
                            }}
                            className="absolute -top-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors active:scale-95 z-10"
                            aria-label="Edit Profile"
                        >
                            <img
                                src={pencilIcon}
                                alt="Edit Profile"
                                className="w-3.5 h-3.5 object-contain"
                            />
                        </button>
                    </div>
                    
                    {/* Username */}
                    {profile && (
                        <h2 className="text-white text-xl font-semibold mt-4 mb-2">
                            @{profile.username}
                        </h2>
                    )}
                </div>

                {/* Feeds Deck Button */}
                <div className="mb-8 flex flex-col items-center">
                    <FeedsDeckButton
                        onOpen={handleDeckOpen}
                        disabled={isDeckOpening || isLoading}
                    />
                </div>

                <div className="flex flex-col justify-center items-center mt-8">
                    {/* Friends Icon Button */}
                    <button
                        onClick={() => setCurrentView('friends')}
                        className="cursor-pointer hover:opacity-80 active:scale-95 transition-all duration-200 flex flex-col items-center"
                        aria-label="Manage Friends"
                    >
                        <div className="relative inline-block">
                            <img
                                src={friendsIcon}
                                alt="Friends"
                                className="w-16 h-16 mb-2 relative z-0"
                            />
                            {/* Friend Request Badge */}
                            {receivedRequests && receivedRequests.length > 0 ? (
                                <div 
                                    className="absolute top-0 right-0 rounded-full flex items-center justify-center shadow-xl"
                                    style={{
                                        backgroundColor: '#ef4444',
                                        border: '2px solid #ffffff',
                                        minWidth: '24px',
                                        height: '24px',
                                        padding: receivedRequests.length > 9 ? '0 4px' : '0 6px',
                                        transform: 'translate(25%, -25%)',
                                        zIndex: 1000,
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                                    }}
                                >
                                    <span 
                                        className="text-xs font-bold leading-none"
                                        style={{ 
                                            color: '#ffffff',
                                            fontSize: '11px',
                                            fontWeight: '700'
                                        }}
                                    >
                                        {receivedRequests.length > 9 ? '9+' : receivedRequests.length}
                                    </span>
                                </div>
                            ) : null}
                        </div>
                        <span className="text-white font-bold text-sm">
                            Manage Friends
                        </span>
                    </button>
                </div>
            </div>
        </>
    )
}
