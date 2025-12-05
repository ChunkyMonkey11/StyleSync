/**
 * useAppInitialization Hook
 * 
 * Centralized hook that manages all app initialization processes:
 * - Authentication (JWT token and public ID)
 * - Profile check
 * - Friends fetch
 * - Product feed sync (non-blocking)
 * 
 * Enforces minimum 2-second display time for smooth UX.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from './useAuth'
import { useFriendRequests } from './useFriendRequests'
import { useProductFeedSync } from './useProductFeedSync' // Starts background sync automatically

interface Friend {
  id: string
  friend_id: string
  shop_public_id: string
  friend_profile: {
    username: string
    display_name: string
    profile_pic: string
    shop_public_id: string
  }
  created_at: string
}

interface UseAppInitializationReturn {
  isInitializing: boolean
  error: string | null
  initializationData: {
    hasProfile: boolean
    publicId?: string
    friends?: Friend[]
  } | null
  retry: () => void
}

const MINIMUM_DISPLAY_TIME_MS = 2000 // 2 seconds as requested

export function useAppInitialization(): UseAppInitializationReturn {
  const { getValidToken, authData } = useAuth()
  const { refreshData: refreshFriends } = useFriendRequests()
  // useProductFeedSync() starts background product sync automatically (non-blocking)
  useProductFeedSync()
  
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initializationData, setInitializationData] = useState<{
    hasProfile: boolean
    publicId?: string
    friends?: Friend[]
  } | null>(null)
  
  const hasInitializedRef = useRef(false)
  const initializationStartTimeRef = useRef<number | null>(null)

  const initialize = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (hasInitializedRef.current) {
      return
    }
    
    // Mark as initializing immediately to prevent duplicate calls
    hasInitializedRef.current = true

    console.log('🚀 Starting app initialization...')
    initializationStartTimeRef.current = Date.now()
    setIsInitializing(true)
    setError(null)

    try {
      // Step 1: Authentication - Get JWT token and public ID
      console.log('🔐 Step 1: Authenticating...')
      const token = await getValidToken()
      console.log('✅ Authentication complete')

      // Wait a moment for authData to be set (it's set asynchronously)
      await new Promise(resolve => setTimeout(resolve, 100))

      // Step 2: Check profile status
      console.log('📋 Step 2: Checking profile...')
      let hasProfile = false
      let publicId: string | undefined

      // Try to get hasProfile from authData first
      if (authData) {
        hasProfile = authData.hasProfile ?? false
        publicId = authData.publicId
        console.log('✅ Got profile status from authData:', hasProfile)
      }

      // If authData doesn't have hasProfile, fallback to check-profile endpoint
      if (authData?.hasProfile === undefined) {
        console.log('📡 Falling back to check-profile endpoint...')
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
          const errorText = await response.text()
          throw new Error(`Failed to check profile: ${response.status} ${errorText}`)
        }

        const result = await response.json()
        hasProfile = result.hasProfile ?? false
        if (result.profile?.shop_public_id) {
          publicId = result.profile.shop_public_id
        }
        console.log('✅ Got profile status from check-profile:', hasProfile)
      }

      // Step 3: Fetch friends (non-blocking - can fail gracefully)
      console.log('👥 Step 3: Fetching friends...')
      let friendsData: Friend[] | undefined
      try {
        // Fetch friends directly via API
        const friendsResponse = await fetch(
          'https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/get-friends',
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (friendsResponse.ok) {
          const friendsResult = await friendsResponse.json()
          friendsData = friendsResult.friends || []
          console.log('✅ Friends fetched:', friendsData.length)
        } else {
          console.warn('⚠️ Friends fetch returned non-OK status:', friendsResponse.status)
        }
      } catch (friendsError) {
        console.warn('⚠️ Friends fetch failed (non-critical):', friendsError)
        // Don't throw - friends fetch is optional
      }
      
      // Also trigger the hook's refresh for consistency (non-blocking)
      refreshFriends().catch(err => {
        console.warn('⚠️ Hook friends refresh failed (non-critical):', err)
      })

      // Step 4: Enforce minimum display time
      const elapsedTime = Date.now() - (initializationStartTimeRef.current || Date.now())
      const remainingTime = Math.max(0, MINIMUM_DISPLAY_TIME_MS - elapsedTime)
      
      if (remainingTime > 0) {
        console.log(`⏳ Waiting ${remainingTime}ms to meet minimum display time...`)
        await new Promise(resolve => setTimeout(resolve, remainingTime))
      }

      // Step 5: Set initialization data
      const data = {
        hasProfile,
        publicId,
        friends: friendsData
      }
      
      setInitializationData(data)
      setIsInitializing(false)
      
      console.log('✅ App initialization complete:', {
        hasProfile,
        publicId,
        friendsCount: friendsData?.length ?? 0
      })

    } catch (err) {
      console.error('❌ Initialization error:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize app')
      setIsInitializing(false)
      // Reset hasInitializedRef on error so retry can work
      hasInitializedRef.current = false
    }
  }, [getValidToken, authData, refreshFriends])

  // Run initialization on mount
  useEffect(() => {
    if (!hasInitializedRef.current) {
      initialize()
    }
  }, [initialize])

  // Note: Product feed sync is automatically started by useProductFeedSync() hook
  // It runs in the background and doesn't block initialization

  const retry = useCallback(() => {
    hasInitializedRef.current = false
    setInitializationData(null)
    initialize()
  }, [initialize])

  return {
    isInitializing,
    error,
    initializationData,
    retry
  }
}

