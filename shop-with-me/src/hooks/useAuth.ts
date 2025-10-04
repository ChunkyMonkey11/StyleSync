import { useCurrentUser, useSecureStorage, useGenerateUserToken } from '@shopify/shop-minis-react'
import { useCallback, useEffect, useState } from 'react'

// Your Supabase project URL
const AUTH_API = 'https://aedyzminlpeiyhhyuefc.supabase.co/functions/v1/auth'

interface AuthData {
  token: string
  expiresAt: number
  publicId: string
  userState: string
}

export function useAuth() {
  const { currentUser } = useCurrentUser()
  const { getSecret, setSecret, removeSecret } = useSecureStorage()
  const { generateUserToken } = useGenerateUserToken()
  const [authData, setAuthData] = useState<AuthData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load stored auth data on mount
  useEffect(() => {
    async function loadAuth() {
      try {
        const stored = await getSecret()
        if (stored) {
          const data: AuthData = JSON.parse(stored)
          // Check if still valid (with 1 day buffer)
          if (data.expiresAt > Date.now() + 86400000) {
            setAuthData(data)
            console.log('✅ Loaded valid auth data:', data.publicId)
          } else {
            await removeSecret() // Clear expired token
            console.log('⏰ Auth data expired, will refresh')
          }
        }
      } catch (error) {
        console.error('❌ Failed to load auth data:', error)
      }
    }
    loadAuth()
  }, [getSecret, removeSecret])

  // Get or refresh JWT token
  const getValidToken = useCallback(async (): Promise<AuthData> => {
    // Check if current token is still valid
    if (authData && authData.expiresAt > Date.now() + 86400000) {
      return authData
    }

    // Get new token
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🔐 Starting authentication...')
      
      // Check if we have a current user
      if (!currentUser) {
        throw new Error('No current user available - please ensure you are signed in to Shopify')
      }
      
      console.log('👤 Current user:', currentUser)
      
      // Generate real Shopify user token
      const shopifyToken = await generateUserToken()
      console.log('🔐 Generated Shopify token:', shopifyToken)
      
      // Exchange token with our auth service
      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${shopifyToken}`
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Auth service error: ${response.status} ${errorText}`)
      }
      
      const authResponse = await response.json()
      console.log('✅ Auth service response:', authResponse)
      
      // Store securely
      const newAuthData: AuthData = {
        token: authResponse.token,
        expiresAt: Date.now() + (authResponse.expiresIn * 1000),
        publicId: authResponse.publicId,
        userState: authResponse.userState
      }
      await setSecret({ value: JSON.stringify(newAuthData) })
      
      setAuthData(newAuthData)
      return newAuthData
      
    } catch (error) {
      console.error('❌ Authentication error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
      setError(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [authData, currentUser, setSecret])

  // Clear authentication
  const clearAuth = useCallback(async () => {
    await removeSecret()
    setAuthData(null)
    setError(null)
  }, [removeSecret])

  return { 
    getValidToken, 
    clearAuth, 
    isLoading, 
    isAuthenticated: !!authData,
    authData,
    error
  }
}
