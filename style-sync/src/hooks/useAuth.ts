// useAuth Hook - JWT Authentication Management for Shop Minis
// This hook handles authentication flow with Supabase Edge Functions

import { useGenerateUserToken, useSecureStorage } from '@shopify/shop-minis-react'
import { useCallback, useEffect, useState } from 'react'

// The auth Edge Function endpoint
const AUTH_API = 'https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/auth'

// Structure of stored authentication data
interface AuthData {
  token: string      // JWT token for API calls
  expiresAt: number  // Timestamp when token expires
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

  // ============================================
  // LOAD STORED TOKEN ON MOUNT
  // ============================================
  // Check if we have a valid token stored from a previous session
  useEffect(() => {
    async function loadToken() {
      try {
        const stored = await getSecret()
        if (stored) {
          const data: AuthData = JSON.parse(stored)
          
          // Check if token is still valid (with 1 day buffer for safety)
          // If expires in more than 1 day, we can still use it
          if (data.expiresAt > Date.now() + 86400000) {  // 86400000ms = 1 day
            setJwtToken(data.token)
            console.log('Loaded existing JWT token from secure storage')
          } else {
            // Token expired or expiring soon, clear it
            await removeSecret()
            console.log('Stored token expired, cleared from storage')
          }
        }
      } catch (error) {
        console.error('Failed to load token:', error)
      }
    }
    loadToken()
  }, [getSecret, removeSecret])

  // ============================================
  // GET OR REFRESH JWT TOKEN
  // ============================================
  /**
   * Gets a valid JWT token for API calls
   * - Returns existing token if still valid
   * - Fetches new token if expired or missing
   * - Automatically stores new tokens securely
   */
  const getValidToken = useCallback(async (): Promise<string> => {
    // Check if current token is still valid
    if (jwtToken) {
      const stored = await getSecret()
      if (stored) {
        const data: AuthData = JSON.parse(stored)
        // If expires in more than 1 day, use existing token
        if (data.expiresAt > Date.now() + 86400000) {
          console.log('Using existing JWT token')
          return jwtToken
        }
      }
    }

    // Need to get a new token
    console.log('Fetching new JWT token...')
    setIsLoading(true)
    
    try {
      // Step 1: Get Shop Mini token from SDK
      const result = await generateUserToken()
      if (!result.data?.token) {
        throw new Error('Failed to generate Shop Mini token')
      }
      
      const shopMiniToken = result.data.token
      console.log('Got Shop Mini token, exchanging for JWT...')

      // Step 2: Exchange Shop Mini token for JWT via auth Edge Function
      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${shopMiniToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Authentication failed: ${response.status} ${errorText}`)
      }

      const { token, expiresIn } = await response.json()
      
      if (!token) {
        throw new Error('No token returned from auth endpoint')
      }

      console.log('Got JWT token, expires in', expiresIn, 'seconds')

      // Step 3: Store JWT token securely
      const authData: AuthData = {
        token,
        expiresAt: Date.now() + (expiresIn * 1000)  // Convert seconds to milliseconds
      }
      
      await setSecret({ value: JSON.stringify(authData) })
      setJwtToken(token)
      
      return token
      
    } catch (error) {
      console.error('Authentication error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [jwtToken, generateUserToken, getSecret, setSecret])

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
    setJwtToken(null)
  }, [removeSecret])

  // Return hook interface
  return {
    getValidToken,    // Call this to get a token for API requests
    clearAuth,        // Call this to logout/clear token
    isLoading,        // True when fetching new token
    isAuthenticated: !!jwtToken  // True if we have a token
  }
}

