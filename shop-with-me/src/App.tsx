import { useState, useEffect, useCallback } from 'react'
import { useCurrentUser } from '@shopify/shop-minis-react'
import { useAuth } from './hooks/useAuth'
import { DatabaseApi } from './services/databaseApi'
import { UsernameSelection } from './components/UsernameSelection'

type View = 'loading' | 'auth' | 'username' | 'main'
type UserProfile = {
  user_id: string
  username?: string
  display_name: string
  profile_pic?: string
  bio?: string
  created_at: string
}

export function App() {
  const { currentUser } = useCurrentUser()
  const { getValidToken, clearAuth, isLoading, isAuthenticated, authData, error } = useAuth()
  const [view, setView] = useState<View>('loading')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [databaseApi, setDatabaseApi] = useState<DatabaseApi | null>(null)
  const [needsUsername, setNeedsUsername] = useState(false)

  // Initialize authentication
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!isAuthenticated) {
          await getValidToken()
        }
      } catch (error) {
        console.error('❌ Authentication failed:', error)
        setView('auth')
      }
    }

    initializeAuth()
  }, [isAuthenticated, getValidToken])

  // Check user profile when authenticated
  useEffect(() => {
    const checkUserProfile = async () => {
      if (!authData || !currentUser) return

      try {
        const api = new DatabaseApi(authData)
        setDatabaseApi(api)

        // Check if user profile exists
        const profile = await api.getUserProfile(authData.publicId)

        if (profile) {
          setUserProfile(profile)
          setView('main')
        } else {
          // User needs to select username
          setNeedsUsername(true)
          setView('username')
        }
      } catch (error) {
        console.error('❌ Error checking user profile:', error)
        // If profile doesn't exist, show username selection
        setNeedsUsername(true)
        setView('username')
      }
    }

    if (authData && currentUser) {
      checkUserProfile()
    }
  }, [authData, currentUser])

  // Handle username selection
  const handleUsernameSelected = useCallback(async (username: string) => {
    if (!databaseApi || !currentUser) return

    try {
      const profileData = {
        user_id: databaseApi.getPublicId(),
        username,
        display_name: currentUser.displayName || 'User',
        profile_pic: (currentUser as any)?.avatarImage?.url || undefined,
        bio: undefined
      }

      const profile = await databaseApi.createUserProfile(profileData)
      setUserProfile(profile)
      setNeedsUsername(false)
      setView('main')
    } catch (error) {
      console.error('❌ Error creating user profile:', error)
      throw error
    }
  }, [databaseApi, currentUser])

  // Generate fallback username
  const generateFallbackUsername = useCallback(() => {
    if (!currentUser?.displayName) return `user_${Date.now()}`
    const base = currentUser.displayName.toLowerCase().replace(/[^a-z0-9]/g, '_')
    const timestamp = Date.now().toString().slice(-4)
    return `${base}_${timestamp}`
  }, [currentUser])

  // Check username availability
  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (!databaseApi) return false
    try {
      return await databaseApi.checkUsernameAvailability(username)
    } catch (error) {
      console.error('❌ Error checking username:', error)
      return false
    }
  }, [databaseApi])

  // Loading state
  if (isLoading || view === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Authentication error
  if (error || view === 'auth') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-red-600">Authentication Error</h2>
          <p className="mb-4 text-gray-600">{error || 'Failed to authenticate with Shopify'}</p>
          <button
            onClick={() => {
              clearAuth()
              setView('loading')
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Username selection
  if (needsUsername || view === 'username') {
    return (
      <UsernameSelection
        onUsernameSelected={handleUsernameSelected}
        onCancel={() => {
          setNeedsUsername(false)
          setView('auth')
        }}
        isDarkMode={false}
        checkAvailability={checkUsernameAvailability}
        generateFallback={generateFallbackUsername}
      />
    )
  }

  // Main app
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">StyleSync</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">@{userProfile?.username}</span>
            <button
              onClick={clearAuth}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🎉 Welcome to StyleSync!</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800">Shopify Public ID</h3>
                <p className="text-sm text-blue-600 font-mono">{authData?.publicId}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800">Username</h3>
                <p className="text-sm text-green-600">@{userProfile?.username}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">User Profile</h3>
              <pre className="text-xs bg-white p-2 rounded overflow-auto">
                {JSON.stringify(userProfile, null, 2)}
              </pre>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">✅ Migration Complete!</h3>
              <p className="text-sm text-yellow-700">
                Your app is now using Shopify public IDs and username system.
                Database connection is working through edge functions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}