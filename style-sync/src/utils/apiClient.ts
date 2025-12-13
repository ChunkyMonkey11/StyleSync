/**
 * Centralized API Client
 * Handles authentication, retries, and error handling for all API calls
 */

import { createErrorFromResponse, isRetryableError, AuthenticationError, NetworkError, ApiError } from './errors'

// Base API URL
const API_BASE_URL = 'https://fhyisvyhahqxryanjnby.supabase.co/functions/v1'

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000] // Exponential backoff: 1s, 2s, 4s

// Status codes that should trigger retry
const RETRYABLE_STATUS_CODES = [401, 429, 500, 502, 503, 504]

interface ApiClientOptions {
  retries?: number
  retryDelay?: number
  timeout?: number
}

interface QueuedRequest {
  resolve: (value: Response) => void
  reject: (error: Error) => void
  url: string
  options: RequestInit
}

/**
 * API Client class that handles:
 * - Automatic token injection
 * - 401 error handling with token refresh
 * - Request queuing during token refresh
 * - Exponential backoff retry logic
 * - Network error handling
 */
class ApiClient {
  private requestQueue: QueuedRequest[] = []
  private isRefreshing = false
  private getTokenFn: (() => Promise<string>) | null = null
  private refreshTokenFn: (() => Promise<string>) | null = null

  /**
   * Set the token getter function from useAuth hook
   */
  setTokenGetter(getToken: () => Promise<string>) {
    this.getTokenFn = getToken
  }

  /**
   * Set the token refresh function from useAuth hook
   */
  setTokenRefresher(refreshToken: () => Promise<string>) {
    this.refreshTokenFn = refreshToken
  }

  /**
   * Main request method that wraps fetch with all error handling
   */
  async request(url: string, options: RequestInit = {}, clientOptions: ApiClientOptions = {}): Promise<Response> {
    const maxRetries = clientOptions.retries ?? MAX_RETRIES

    // Ensure we have a token getter
    if (!this.getTokenFn) {
      throw new Error('API Client not initialized. Call setTokenGetter() first.')
    }

    // Make the request with retry logic
    return this.retryWithBackoff(
      () => this.makeRequest(url, options),
      maxRetries,
      clientOptions.retryDelay
    )
  }

  /**
   * Internal method to make a single request
   */
  private async makeRequest(url: string, options: RequestInit): Promise<Response> {
    if (!this.getTokenFn) {
      throw new Error('Token getter not set')
    }

    // Get token for this request
    const token = await this.getTokenFn()

    // Build full URL if relative
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}/${url}`

    // Make the request
    let response: Response
    try {
      response = await fetch(fullUrl, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })
    } catch (error) {
      // Network error (offline, timeout, etc.)
      throw NetworkError.fromError(error instanceof Error ? error : new Error('Network request failed'))
    }

    // Handle 401 Unauthorized - try to refresh token and retry
    if (response.status === 401) {
      return this.handle401(url, options)
    }

    // For other errors, throw appropriate error type
    if (!response.ok) {
      const errorText = await this.getErrorText(response)
      throw createErrorFromResponse(response.status, errorText)
    }

    return response
  }

  /**
   * Handle 401 errors by refreshing token and retrying request
   */
  private async handle401(url: string, options: RequestInit): Promise<Response> {
    // If we're already refreshing, queue this request
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push({ resolve, reject, url, options })
      })
    }

    // Start token refresh
    this.isRefreshing = true

    try {
      if (!this.refreshTokenFn) {
        // Fallback to getTokenFn if no explicit refresh function
        if (!this.getTokenFn) {
          throw new AuthenticationError('No token refresh function available')
        }
        await this.getTokenFn()
      } else {
        await this.refreshTokenFn()
      }

      // Retry the original request with new token
      const retryResponse = await this.makeRequest(url, options)

      // Process queued requests
      await this.processQueue()

      return retryResponse
    } catch (error) {
      // Token refresh failed - reject all queued requests
      this.rejectQueue(error instanceof Error ? error : new Error('Token refresh failed'))
      throw error
    } finally {
      this.isRefreshing = false
    }
  }

  /**
   * Process queued requests after token refresh
   */
  private async processQueue(): Promise<void> {
    const queue = [...this.requestQueue]
    this.requestQueue = []

    for (const queuedRequest of queue) {
      try {
        const response = await this.makeRequest(queuedRequest.url, queuedRequest.options)
        queuedRequest.resolve(response)
      } catch (error) {
        queuedRequest.reject(error instanceof Error ? error : new Error('Request failed'))
      }
    }
  }

  /**
   * Reject all queued requests with an error
   */
  private rejectQueue(error: Error): void {
    const queue = [...this.requestQueue]
    this.requestQueue = []

    for (const queuedRequest of queue) {
      queuedRequest.reject(error)
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryWithBackoff(
    fn: () => Promise<Response>,
    maxRetries: number,
    baseDelay?: number
  ): Promise<Response> {
    let lastError: Error | ApiError

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')

        // Don't retry if error is not retryable
        if (!isRetryableError(lastError)) {
          throw lastError
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          throw lastError
        }

        // Calculate delay (exponential backoff)
        const delay = baseDelay 
          ? baseDelay * Math.pow(2, attempt)
          : RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1]

        // Wait before retrying
        await this.sleep(delay)

        // Log retry attempt
        console.log(`🔄 Retrying request (attempt ${attempt + 1}/${maxRetries})...`)
      }
    }

    throw lastError!
  }

  /**
   * Extract error text from response
   */
  private async getErrorText(response: Response): Promise<string> {
    try {
      const text = await response.text()
      if (!text) return `HTTP ${response.status}`
      
      try {
        const json = JSON.parse(text)
        return json.error || json.message || text
      } catch {
        return text
      }
    } catch {
      return `HTTP ${response.status}`
    }
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Create singleton instance
const apiClient = new ApiClient()

/**
 * Initialize API client with token getter and refresher
 */
export function initializeApiClient(
  getToken: () => Promise<string>,
  refreshToken?: () => Promise<string>
) {
  apiClient.setTokenGetter(getToken)
  if (refreshToken) {
    apiClient.setTokenRefresher(refreshToken)
  }
}

/**
 * Make an API request using the centralized client
 */
export async function apiRequest(
  url: string,
  options: RequestInit = {},
  clientOptions?: ApiClientOptions
): Promise<Response> {
  return apiClient.request(url, options, clientOptions)
}

/**
 * Convenience method to make API request and parse JSON response
 */
export async function apiRequestJson<T = any>(
  url: string,
  options: RequestInit = {},
  clientOptions?: ApiClientOptions
): Promise<T> {
  const response = await apiRequest(url, options, clientOptions)
  return response.json()
}

export default apiClient


