import { useState, useEffect } from 'react'
import { OnboardingPage } from './pages/OnboardingPage'
import { MainApp } from './pages/MainApp'
import { useAuth } from './hooks/useAuth'
// No Shopify initialization needed for Shop Minis React

export function App() {
  const [hasProfile, setHasProfile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getValidToken } = useAuth()

  useEffect(() => {
    checkUserProfile()
  }, [])

  const checkUserProfile = async () => {
    try {
      // Get JWT token for authentication
      const token = await getValidToken()
      
      // Call check-profile Edge Function
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

      if (!response.ok) {
        throw new Error(`Failed to check profile: ${response.status}`)
      }

      const result = await response.json()
      setHasProfile(result.hasProfile)
      
    } catch (error) {
      console.error('Error checking profile:', error)
      setError('Failed to load profile. Please try again.')
      setHasProfile(false)
    } finally {
      setIsLoading(false)
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
