import { useState, useEffect, useRef } from 'react'
import { OnboardingPage } from './pages/auth/OnboardingPage'
import { MainApp } from './pages/MainApp'
import { useAuth } from './hooks/useAuth'
// No Shopify initialization needed for Shop Minis React

export function App() {
  const [hasProfile, setHasProfile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getValidToken, authData } = useAuth()
  const hasCheckedProfile = useRef(false)

  useEffect(() => {
    if (!hasCheckedProfile.current) {
      hasCheckedProfile.current = true
      checkUserProfile()
    }
  }, [])

  // Also check authData when it changes (in case it's loaded from storage)
  useEffect(() => {
    if (authData && authData.hasProfile !== undefined && hasCheckedProfile.current) {
      console.log('📋 App: Got hasProfile from auth data:', authData.hasProfile)
      setHasProfile(authData.hasProfile)
      if (isLoading) {
        setIsLoading(false)
      }
    }
  }, [authData, isLoading])

  const checkUserProfile = async () => {
    console.log('🔍 App: Checking user profile...')
    try {
      // Get JWT token for authentication (this will also trigger auth and get hasProfile)
      console.log('🔐 App: Getting JWT token...')
      await getValidToken()
      console.log('✅ App: Got JWT token')
      
      // Wait a moment for authData to be set (it's set asynchronously)
      // Check if we have hasProfile from auth response after token is fetched
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Check if we have hasProfile from auth response
      // If authData is available, use it; otherwise fallback to check-profile
      const currentAuthData = authData
      if (currentAuthData && currentAuthData.hasProfile !== undefined) {
        console.log('✅ App: Using hasProfile from auth response:', currentAuthData.hasProfile)
        setHasProfile(currentAuthData.hasProfile)
        setIsLoading(false)
        return
      }
      
      // Fallback: Call check-profile Edge Function if authData not available yet
      console.log('📡 App: Calling check-profile Edge Function (fallback)...')
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

      console.log('📡 App: check-profile response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ App: check-profile failed:', response.status, errorText)
        throw new Error(`Failed to check profile: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ App: Profile check result:', result)
      setHasProfile(result.hasProfile)
      
    } catch (error) {
      console.error('❌ App: Error checking profile:', error)
      console.error('❌ App: Error type:', typeof error)
      console.error('❌ App: Error constructor:', error?.constructor?.name)
      
      if (error instanceof Error) {
        console.error('❌ App: Error name:', error.name)
        console.error('❌ App: Error message:', error.message)
        console.error('❌ App: Error stack:', error.stack)
      } else {
        console.error('❌ App: Non-Error object:', JSON.stringify(error, null, 2))
      }
      
      setError('Failed to load profile. Please try again.')
      setHasProfile(false)
    } finally {
      setIsLoading(false)
      console.log('✅ App: Profile check complete')
    }
  }

  const handleProfileComplete = () => {
    setHasProfile(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <p className="text-lg">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-4">
        <p className="text-lg text-red-600">{error}</p>
        <button 
          onClick={checkUserProfile}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    )
  }

  return hasProfile ? <MainApp /> : <OnboardingPage onComplete={handleProfileComplete} />
}
