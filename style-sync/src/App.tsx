import { useState, useEffect, useRef } from 'react'
import { OnboardingPage } from './pages/auth/OnboardingPage'
import { MainApp } from './pages/MainApp'
import { LoadingScreen } from './components/LoadingScreen'
import { useAppInitialization } from './hooks/useAppInitialization'
// No Shopify initialization needed for Shop Minis React

export function App() {
  const { isInitializing, error, initializationData, retry } = useAppInitialization()
  const [hasProfile, setHasProfile] = useState(false)
  const [showLoading, setShowLoading] = useState(true)
  const [animationStartTime] = useState(Date.now())
  const onboardingCompletedRef = useRef(false)

  // Add class to body when app is loaded (not showing loading screen)
  // This prevents the purple background from flashing before React renders
  useEffect(() => {
    if (!isInitializing && !showLoading && !error) {
      document.body.classList.add('app-loaded')
    } else {
      document.body.classList.remove('app-loaded')
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('app-loaded')
    }
  }, [isInitializing, showLoading, error])

  // Update hasProfile when initialization completes
  // Only update from initializationData if onboarding hasn't been completed
  useEffect(() => {
    if (initializationData && !isInitializing && !onboardingCompletedRef.current) {
      setHasProfile(initializationData.hasProfile)
    }
  }, [initializationData, isInitializing])

  // Handle smooth transition from loading screen to app
  // Ensure animation completes (2.8s) even if initialization finishes early
  useEffect(() => {
    if (!isInitializing && !error) {
      const elapsed = Date.now() - animationStartTime
      const animationDuration = 2800 // Match animation duration
      const remainingTime = Math.max(0, animationDuration - elapsed)
      
      const timer = setTimeout(() => {
        setShowLoading(false)
      }, remainingTime)
      
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isInitializing, error, animationStartTime])

  const handleProfileComplete = () => {
    onboardingCompletedRef.current = true
    setHasProfile(true)
  }

  // Show loading screen during initialization or during exit animation
  if (isInitializing || showLoading) {
    return <LoadingScreen error={error} onRetry={retry} />
  }

  // Show error state if initialization failed
  if (error && !initializationData) {
    return <LoadingScreen error={error} onRetry={retry} />
  }

  // Determine if user should see onboarding or main app
  const shouldShowOnboarding = !initializationData?.hasProfile && !hasProfile

  return shouldShowOnboarding ? (
    <OnboardingPage onComplete={handleProfileComplete} />
  ) : (
    <MainApp />
  )
}
