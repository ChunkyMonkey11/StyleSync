/**
 * Custom Error Types for API Error Handling
 * Provides structured error classes with user-friendly messages
 */

/**
 * Base API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'ApiError'
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }
}

/**
 * Authentication Error (401 Unauthorized)
 * Thrown when authentication fails or token is invalid
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication failed. Please try again.', originalError?: Error) {
    super(message, 401, originalError)
    this.name = 'AuthenticationError'
  }

  static fromResponse(statusCode: number, errorText?: string): AuthenticationError {
    const message = errorText || 'Your session has expired. Please refresh the page.'
    return new AuthenticationError(message)
  }
}

/**
 * Token Expired Error
 * Specific error for expired JWT tokens
 */
export class TokenExpiredError extends AuthenticationError {
  constructor(message: string = 'Your session has expired. Refreshing...') {
    super(message)
    this.name = 'TokenExpiredError'
  }
}

/**
 * Network Error
 * Thrown when network requests fail (offline, timeout, etc.)
 */
export class NetworkError extends ApiError {
  constructor(message: string = 'Network error. Please check your connection.', originalError?: Error) {
    super(message, 0, originalError)
    this.name = 'NetworkError'
  }

  static fromError(error: Error): NetworkError {
    return new NetworkError(
      error.message || 'Network request failed. Please check your internet connection.',
      error
    )
  }
}

/**
 * Server Error (5xx)
 * Thrown when server returns 5xx status codes
 */
export class ServerError extends ApiError {
  constructor(message: string = 'Server error. Please try again later.', statusCode: number = 500, originalError?: Error) {
    super(message, statusCode, originalError)
    this.name = 'ServerError'
  }

  static fromResponse(statusCode: number, errorText?: string): ServerError {
    const message = errorText || `Server error (${statusCode}). Please try again later.`
    return new ServerError(message, statusCode)
  }
}

/**
 * Client Error (4xx, excluding 401)
 * Thrown for client-side errors like 400, 403, 404
 */
export class ClientError extends ApiError {
  constructor(message: string, statusCode: number, originalError?: Error) {
    super(message, statusCode, originalError)
    this.name = 'ClientError'
  }

  static fromResponse(statusCode: number, errorText?: string): ClientError {
    const message = errorText || `Request failed (${statusCode}). Please check your input.`
    return new ClientError(message, statusCode)
  }
}

/**
 * Rate Limit Error (429)
 * Thrown when rate limit is exceeded
 */
export class RateLimitError extends ApiError {
  constructor(message: string = 'Too many requests. Please wait a moment and try again.', originalError?: Error) {
    super(message, 429, originalError)
    this.name = 'RateLimitError'
  }
}

/**
 * Helper function to create appropriate error from response
 */
export function createErrorFromResponse(statusCode: number, errorText?: string): ApiError {
  if (statusCode === 401) {
    return AuthenticationError.fromResponse(statusCode, errorText)
  }
  if (statusCode === 429) {
    return new RateLimitError(errorText)
  }
  if (statusCode >= 500) {
    return ServerError.fromResponse(statusCode, errorText)
  }
  if (statusCode >= 400) {
    return ClientError.fromResponse(statusCode, errorText)
  }
  return new ApiError(errorText || 'Unknown error', statusCode)
}

/**
 * Helper function to check if error is retryable
 */
export function isRetryableError(error: ApiError | Error): boolean {
  if (error instanceof ApiError) {
    // Retry on: 401 (auth), 429 (rate limit), 500, 502, 503, 504 (server errors)
    const retryableStatusCodes = [401, 429, 500, 502, 503, 504]
    return retryableStatusCodes.includes(error.statusCode)
  }
  // Network errors are retryable
  if (error instanceof NetworkError) {
    return true
  }
  return false
}
