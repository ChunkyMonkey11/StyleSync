/**
 * Application Configuration
 * Centralized configuration for API endpoints and environment-specific settings
 */

// Supabase Functions API base URL
// Set via VITE_SUPABASE_FUNCTIONS_URL environment variable
// Falls back to production URL if not set (for development)
export const API_BASE_URL = 
  import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || 
  'https://fhyisvyhahqxryanjnby.supabase.co/functions/v1'

// Request timeout in milliseconds (30 seconds)
export const REQUEST_TIMEOUT_MS = 30000

// Maximum request body size (1MB)
export const MAX_REQUEST_SIZE_BYTES = 1024 * 1024

