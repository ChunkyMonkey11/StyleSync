import { useEffect, useState, useCallback } from 'react'
import { useSecureStorage } from '@shopify/shop-minis-react'
import { AuthData } from '../types'

// Generate a UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function useAuth() {
  const { getSecret, setSecret } = useSecureStorage()
  const [authData, setAuthData] = useState<AuthData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize or load existing auth
  useEffect(() => {
    async function createNewUser() {
      try {
        const newUserId = generateUUID()
        const newAuthData: AuthData = {
          userId: newUserId,
          createdAt: new Date().toISOString()
        }
        
        console.log('✨ Created new user ID:', newUserId.substring(0, 8) + '...')
        
        // Save to secure storage (API: only one secret per Mini)
        await setSecret({ 
          value: JSON.stringify(newAuthData) 
        })
        
        console.log('💾 Saved new user to secure storage')
        setAuthData(newAuthData)
        return newAuthData
      } catch (err) {
        console.error('❌ Error creating new user:', err)
        throw err
      }
    }

    async function initAuth() {
      try {
        console.log('🔐 Initializing auth...')
        
        // Try to load existing auth data (API: getSecret takes no arguments)
        const stored = await getSecret()
        console.log('🔑 Secure storage result:', stored ? 'found' : 'not found', 'type:', typeof stored)
        
        if (stored && typeof stored === 'string') {
          try {
            const data: AuthData = JSON.parse(stored)
            console.log('✅ Loaded existing user ID:', data.userId.substring(0, 8) + '...')
            setAuthData(data)
          } catch (parseError) {
            console.error('❌ Failed to parse auth data, creating new user...', parseError)
            await createNewUser()
          }
        } else {
          // No existing user, create new
          console.log('👤 No existing user, creating new...')
          await createNewUser()
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error)
        setError(error instanceof Error ? error.message : 'Failed to initialize auth')
      } finally {
        console.log('✅ Auth initialization complete, isLoading set to false')
        setIsLoading(false)
      }
    }

    initAuth()
  }, [getSecret, setSecret])

  // Get the current user ID
  const getUserId = useCallback(() => {
    return authData?.userId || null
  }, [authData])

  return {
    userId: authData?.userId || null,
    authData,
    isLoading,
    error,
    getUserId
  }
}


