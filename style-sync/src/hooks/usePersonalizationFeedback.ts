import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'

interface PersonalizationEvent {
  eventType: 'view' | 'click' | 'favorite' | 'purchase' | 'dismiss'
  intentName: string
  productId: string
  timestamp: string
  sessionId?: string
}

interface UsePersonalizationFeedbackReturn {
  trackEvent: (event: Omit<PersonalizationEvent, 'timestamp'>) => Promise<void>
  isTracking: boolean
  error: string | null
}

/**
 * Hook for tracking user interactions with personalized recommendations
 */
export function usePersonalizationFeedback(): UsePersonalizationFeedbackReturn {
  const { getValidToken } = useAuth()
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trackEvent = useCallback(async (eventData: Omit<PersonalizationEvent, 'timestamp'>) => {
    try {
      setIsTracking(true)
      setError(null)

      const token = await getValidToken()

      const event: PersonalizationEvent = {
        ...eventData,
        timestamp: new Date().toISOString(),
        sessionId: sessionStorage.getItem('personalization_session') || generateSessionId()
      }

      // Store in session storage for immediate feedback
      const existingEvents = JSON.parse(sessionStorage.getItem('personalization_events') || '[]')
      existingEvents.push(event)
      sessionStorage.setItem('personalization_events', JSON.stringify(existingEvents))

      // Send to backend for long-term storage
      const response = await fetch(
        'https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/track-personalization-feedback',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ event })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to track feedback')
      }

      console.log('Personalization feedback tracked:', eventData)

    } catch (err) {
      console.error('Error tracking personalization feedback:', err)
      setError(err instanceof Error ? err.message : 'Failed to track feedback')
    } finally {
      setIsTracking(false)
    }
  }, [getValidToken])

  return {
    trackEvent,
    isTracking,
    error
  }
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Utility function to get accumulated feedback from current session
 */
export function getSessionFeedback(): PersonalizationEvent[] {
  try {
    return JSON.parse(sessionStorage.getItem('personalization_events') || '[]')
  } catch {
    return []
  }
}

/**
 * Utility function to clear session feedback
 */
export function clearSessionFeedback(): void {
  sessionStorage.removeItem('personalization_events')
}

