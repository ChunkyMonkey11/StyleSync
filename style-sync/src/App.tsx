import { useState, useEffect } from 'react'
import { OnboardingPage } from './pages/OnboardingPage'
import { MainApp } from './pages/MainApp'
import { supabase } from './lib/supabase'

export function App() {
  const [hasProfile, setHasProfile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkUserProfile()
  }, [])

  const checkUserProfile = async () => {
    try {
      // For now, check if we have any profiles in the database
      // Later, you'll check by Shop user ID
      const { data, error } = await supabase
        .from('userprofiles')
        .select('*')
        .limit(1)

      if (error) {
        console.error('Error checking profile:', error)
        setHasProfile(false)
      } else {
        setHasProfile(data && data.length > 0)
      }
    } catch (error) {
      console.error('Error:', error)
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

  return hasProfile ? <MainApp /> : <OnboardingPage onComplete={handleProfileComplete} />
}
