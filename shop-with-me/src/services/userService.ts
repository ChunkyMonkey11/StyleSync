import { supabase } from '../lib/supabase'
import type { OnboardingFormData } from '../components/OnboardingForm'

/**
 * Service response type
 */
export type ServiceResponse<T> = {
  data?: T
  error?: {
    message: string
    code?: string | number
  }
}

/**
 * User profile from database
 */
export type UserProfile = {
  sync_id: string
  username: string
  bio: string | null
  display_name: string | null
  pfp_url: string | null
  created_at: string
  updated_at: string
}

/**
 * Create a new user profile via edge function
 */
export async function createUserProfile(
  formData: OnboardingFormData
): Promise<ServiceResponse<UserProfile>> {
  try {
    console.log('📤 Calling create-profile edge function...')
    console.log('📤 Form data:', formData)

    const { data, error } = await supabase.functions.invoke('create-profile', {
      body: formData,
    })

    console.log('📤 Edge function response:', { data, error })

    if (error) {
      console.error('❌ Edge function error:', error)
      return {
        error: {
          message: error.message || 'Failed to create profile',
          code: error.context?.status || 500,
        },
      }
    }

    console.log('✅ Profile created successfully:', data)
    return { data }
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    return {
      error: {
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      },
    }
  }
}

/**
 * Check if a username is available
 */
export async function checkUsernameAvailability(
  username: string
): Promise<ServiceResponse<boolean>> {
  try {
    // Direct database query (faster than edge function for simple checks)
    const { error } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .single()

    if (error) {
      // PGRST116 = no rows returned = username available
      if (error.code === 'PGRST116') {
        return { data: true } // Available
      }
      throw error
    }

    // If we got data, username is taken
    return { data: false }
  } catch (err) {
    console.error('❌ Username check error:', err)
    return {
      error: {
        message: 'Failed to check username availability',
      },
    }
  }
}

/**
 * Get user profile by sync_id
 */
export async function getUserProfile(
  syncId: string
): Promise<ServiceResponse<UserProfile>> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('sync_id', syncId)
      .single()

    if (error) throw error

    return { data }
  } catch (err) {
    console.error('❌ Get profile error:', err)
    return {
      error: {
        message: 'Failed to get user profile',
      },
    }
  }
}

/**
 * Get user profile by username
 */
export async function getUserProfileByUsername(
  username: string
): Promise<ServiceResponse<UserProfile>> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', username.toLowerCase())
      .single()

    if (error) throw error

    return { data }
  } catch (err) {
    console.error('❌ Get profile by username error:', err)
    return {
      error: {
        message: 'User not found',
      },
    }
  }
}

