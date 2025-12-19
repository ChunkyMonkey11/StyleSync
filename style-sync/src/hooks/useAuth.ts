// useAuth Hook - JWT Authentication Management for Shop Minis
// This hook handles authentication flow with Supabase Edge Functions

import { useGenerateUserToken, useSecureStorage } from '@shopify/shop-minis-react'
import { useCallback, useEffect, useState, useRef } from 'react'
import { initializeApiClient } from '../utils/apiClient'

// The auth Edge Function endpoint
const AUTH_API = 'https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/auth'

// Token refresh thresholds
const TOKEN_REFRESH_THRESHOLD = 3600000 // 1 hour (changed from 1 day)
const BACKGROUND_CHECK_INTERVAL = 300000 // 5 minutes

// Structure of stored authentication data
interface AuthData {
  token: string      // JWT token for API calls
  expiresAt: number  // Timestamp when token expires
  shopMiniToken: string // Shop Mini token for consistency
  publicId?: string  // User's public ID from Minis Admin API
  hasProfile?: boolean // Whether user has a profile
  profile?: any      // User profile data if exists
}

/**
 * useAuth Hook
 * 
 * Manages JWT authentication for Edge Function calls:
 * 1. Exchanges Shop Mini tokens for JWT tokens
 * 2. Stores JWTs securely (not in localStorage)
 * 3. Auto-refreshes expired tokens
 * 4. Provides getValidToken() for API calls
 */
export function useAuth() {
  // Shop Minis SDK hooks
  const { generateUserToken } = useGenerateUserToken()  // Gets Shop Mini token
  const { getSecret, setSecret, removeSecret } = useSecureStorage()  // Secure storage
  
  // State
  const [jwtToken, setJwtToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [authData, setAuthData] = useState<AuthData | null>(null)
  
  // Cache for in-flight token fetch promise to prevent duplicate concurrent requests
  const tokenFetchPromiseRef = useRef<Promise<string> | null>(null)
  
  // Background refresh interval ref
  const backgroundRefreshIntervalRef = useRef<number | null>(null)
  
  // Cache for getSecret() result to avoid rate limiting
  const secretCacheRef = useRef<{ data: string | null; timestamp: number } | null>(null)
  const SECRET_CACHE_TTL = 5000 // Cache for 5 seconds

  // Helper to get secret with caching to avoid rate limits
  const getCachedSecret = useCallback(async (): Promise<string | null> => {
    // Guard: ensure getSecret is available
    if (!getSecret) {
      console.warn('⚠️ getSecret not yet initialized')
      return null
    }
    
    const now = Date.now()
    
    // Return cached value if still valid
    if (secretCacheRef.current && (now - secretCacheRef.current.timestamp) < SECRET_CACHE_TTL) {
      return secretCacheRef.current.data
    }
    
    // Fetch new value
    try {
      const stored = await getSecret()
      secretCacheRef.current = { data: stored, timestamp: now }
      return stored
    } catch (error) {
      console.error('❌ Failed to get secret:', error)
      return null
    }
  }, [getSecret])

  // ============================================
  // LOAD STORED TOKEN ON MOUNT
  // ============================================
  // Check if we have a valid token stored from a previous session
  useEffect(() => {
    async function loadToken() {
      try {
        const stored = await getCachedSecret()
        if (stored) {
          // Handle mock data in localhost (returns "secret-value" string)
          try {
            const data: AuthData = JSON.parse(stored)
            
            // Check if token is still valid (with 1 hour buffer for safety)
            // If expires in more than 1 hour, we can still use it
            if (data.expiresAt > Date.now() + TOKEN_REFRESH_THRESHOLD) {
              setJwtToken(data.token)
              setAuthData(data)
              console.log('✅ Loaded existing JWT token from secure storage')
            } else {
              // Token expired or expiring soon, clear it
              await removeSecret()
              // Clear cache
              secretCacheRef.current = null
              console.log('⏰ Stored token expired, cleared from storage')
            }
          } catch (parseError) {
            // In localhost, getSecret() returns mock string "secret-value"
            console.log('⚠️ Could not parse stored token (likely localhost mock data)')
          }
        } else {
          console.log('ℹ️ No stored token found')
        }
      } catch (error) {
        console.error('❌ Failed to load token:', error)
      }
    }
    loadToken()
  }, [getCachedSecret, removeSecret])

  // ============================================
  // GET OR REFRESH JWT TOKEN
  // ============================================
  /**
   * Gets a valid JWT token for API calls
   * - Returns existing token if still valid
   * - Fetches new token if expired or missing
   * - Automatically stores new tokens securely
   * - Prevents duplicate concurrent fetches by caching the in-flight promise
   */
  const getValidToken = useCallback(async (): Promise<string> => {
    // FIRST: Check if there's already a token fetch in progress (synchronous check)
    // This must happen before any async operations to prevent race conditions
    if (tokenFetchPromiseRef.current) {
      console.log('♻️ Reusing in-flight token fetch')
      return tokenFetchPromiseRef.current
    }

    // SECOND: Check in-memory state first (fastest, no API call)
    if (jwtToken && authData) {
      // Check if token is still valid (with 1 hour buffer)
      if (authData.expiresAt > Date.now() + TOKEN_REFRESH_THRESHOLD) {
        console.log('✅ Using existing JWT token from memory')
        return jwtToken
      }
    }

    // THIRD: Check secure storage (with caching to avoid rate limits)
    if (getCachedSecret) {
      const stored = await getCachedSecret()
      if (stored) {
        try {
          const data: AuthData = JSON.parse(stored)
          // If expires in more than 1 hour, use existing token from storage
          if (data.expiresAt > Date.now() + TOKEN_REFRESH_THRESHOLD) {
            console.log('✅ Using existing JWT token from storage')
            // Update this instance's in-memory state for consistency
            setJwtToken(data.token)
            setAuthData(data)
            return data.token
          }
        } catch (parseError) {
          console.log('⚠️ Token parse error, fetching new token')
        }
      }
    }

    // Check again after async operation (in case another call started while we were checking)
    if (tokenFetchPromiseRef.current) {
      console.log('♻️ Reusing in-flight token fetch (after async check)')
      return tokenFetchPromiseRef.current
    }

    // Need to get a new token
    console.log('🔄 Fetching new JWT token...')
    
    // Create and cache the fetch promise IMMEDIATELY (before any async work)
    // This must be set synchronously to prevent race conditions
    tokenFetchPromiseRef.current = (async () => {
      setIsLoading(true)
    try {
      // Step 1: Get Shop Mini token from SDK or reuse stored one
      console.log('📱 Step 1: Getting Shop Mini token...')
      
      // Check if we have a stored Shop Mini token (use cached secret to avoid rate limit)
      let shopMiniToken: string | undefined
      
      // First check in-memory authData
      if (authData?.shopMiniToken) {
        console.log('♻️ Reusing Shop Mini token from memory')
        shopMiniToken = authData.shopMiniToken
      } else if (getCachedSecret) {
        // Fallback to cached secret check - only if getCachedSecret is available
        const stored = await getCachedSecret()
        if (stored) {
          try {
            const data: AuthData = JSON.parse(stored)
            if (data.shopMiniToken) {
              console.log('♻️ Reusing stored Shop Mini token for consistent hash')
              shopMiniToken = data.shopMiniToken
            }
          } catch (parseError) {
            console.log('⚠️ Could not parse stored data')
          }
        }
      }
      
      // If no stored token, generate a new one
      if (!shopMiniToken) {
        const result = await generateUserToken()
        if (!result.data?.token) {
          console.error('❌ Failed to generate Shop Mini token:', result)
          throw new Error('Failed to generate Shop Mini token')
        }
        shopMiniToken = result.data.token
        console.log('✅ Generated new Shop Mini token')
      }

      console.log('✅ Got Shop Mini token, exchanging for JWT...')

      // Step 2: Exchange Shop Mini token for JWT via auth Edge Function
      console.log('🔐 Step 2: Calling auth Edge Function...')
      console.log('Auth API URL:', AUTH_API)
      
      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${shopMiniToken}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('📡 Auth response status:', response.status)

      // If the response is not ok, throw an error
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Auth failed:', response.status, errorText)
        throw new Error(`Authentication failed: ${response.status} ${errorText}`)
      }

      // If the response is ok, parse the JSON
      const authResponse = await response.json()
      const { token, expiresIn, publicId, hasProfile, profile } = authResponse
      
      // If the token is not present, throw an error
      if (!token) {
        console.error('❌ No token in response')
        throw new Error('No token returned from auth endpoint')
      }

      // We have the token, so we can store it securely
      console.log('✅ Got JWT token, expires in', expiresIn, 'seconds')
      if (publicId) {
        console.log('👤 PublicId:', publicId)
      }
      if (hasProfile !== undefined) {
        console.log('📋 Has profile:', hasProfile)
      }

      // Step 3: Store JWT token securely with profile info
      const newAuthData: AuthData = {
        token,
        expiresAt: Date.now() + (expiresIn * 1000),  // Convert seconds to milliseconds
        shopMiniToken,  // Store for consistency
        publicId,       // Store publicId if available
        hasProfile,     // Store hasProfile status
        profile         // Store profile data if available
      }
      
      await setSecret({ value: JSON.stringify(newAuthData) })
      // Update cache with new data
      secretCacheRef.current = { data: JSON.stringify(newAuthData), timestamp: Date.now() }
      setJwtToken(token)
      setAuthData(newAuthData)
      console.log('💾 Token stored securely')
      
      return token
      
    } catch (error) {
      console.error('❌ Authentication error:', error)
      if (error instanceof Error) {
        console.error('Error name:', error.name)
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      throw error
    } finally {
      setIsLoading(false)
        // Clear the cached promise when done (success or failure)
        tokenFetchPromiseRef.current = null
    }
    })()

    return tokenFetchPromiseRef.current
  }, [jwtToken, authData, generateUserToken, getCachedSecret, setSecret])

  // ============================================
  // REFRESH TOKEN (EXPLICIT)
  // ============================================
  /**
   * Explicitly refresh the token
   * Used by API client when 401 is detected
   */
  const refreshToken = useCallback(async (): Promise<string> => {
    // If already refreshing, wait for existing refresh
    if (isRefreshing && tokenFetchPromiseRef.current) {
      console.log('♻️ Token refresh already in progress, waiting...')
      return tokenFetchPromiseRef.current
    }

    setIsRefreshing(true)
    try {
      // Force token refresh by clearing the cached promise
      tokenFetchPromiseRef.current = null
      const token = await getValidToken()
      console.log('✅ Token refreshed successfully')
      return token
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing, getValidToken])

  // ============================================
  // BACKGROUND TOKEN REFRESH
  // ============================================
  /**
   * Background token refresh that checks periodically
   * Refreshes token when it expires within 1 hour
   */
  useEffect(() => {
    const checkAndRefreshToken = async () => {
      try {
        // Check if we have a token
        if (!authData || !jwtToken) {
          return
        }

        // Check if token expires within threshold
        const timeUntilExpiry = authData.expiresAt - Date.now()
        
        if (timeUntilExpiry <= TOKEN_REFRESH_THRESHOLD && timeUntilExpiry > 0) {
          console.log('🔄 Background: Token expiring soon, refreshing...')
          // Refresh token silently in background
          await refreshToken()
        } else if (timeUntilExpiry <= 0) {
          console.log('⏰ Background: Token expired, refreshing...')
          await refreshToken()
        }
      } catch (error) {
        console.error('❌ Background token refresh failed:', error)
        // Don't throw - background refresh failures shouldn't break the app
      }
    }

    // Initial check
    checkAndRefreshToken()

    // Set up interval to check every 5 minutes
    const intervalId = window.setInterval(checkAndRefreshToken, BACKGROUND_CHECK_INTERVAL)
    backgroundRefreshIntervalRef.current = intervalId

    // Cleanup interval on unmount
    return () => {
      if (backgroundRefreshIntervalRef.current) {
        clearInterval(backgroundRefreshIntervalRef.current)
        backgroundRefreshIntervalRef.current = null
      }
    }
  }, [authData, jwtToken, refreshToken])

  // ============================================
  // INITIALIZE API CLIENT
  // ============================================
  /**
   * Initialize API client with token getter and refresher
   * This allows the API client to automatically handle 401s
   */
  useEffect(() => {
    initializeApiClient(getValidToken, refreshToken)
  }, [getValidToken, refreshToken])

  // ============================================
  // CLEAR AUTHENTICATION
  // ============================================
  /**
   * Clears stored JWT token
   * Useful for logout or error recovery
   */
  const clearAuth = useCallback(async () => {
    console.log('Clearing authentication')
    await removeSecret()
    // Clear cache
    secretCacheRef.current = null
    setJwtToken(null)
    setAuthData(null)
    // Clear any in-flight token fetch promise
    tokenFetchPromiseRef.current = null
  }, [removeSecret])

  // Return hook interface
  return {
    getValidToken,    // Call this to get a token for API requests
    refreshToken,     // Explicit token refresh (used by API client)
    clearAuth,        // Call this to logout/clear token
    isLoading,        // True when fetching new token
    isRefreshing,     // True when token is being refreshed
    isAuthenticated: !!jwtToken,  // True if we have a token
    authData          // Full auth data including hasProfile and profile
  }
}

