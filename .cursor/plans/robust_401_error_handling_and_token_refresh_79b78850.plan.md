---
name: Robust 401 Error Handling and Token Refresh
overview: Implement professional, background error handling for 401 unauthorized errors with automatic token refresh, retry logic, and centralized API client that handles authentication failures gracefully.
todos:
  - id: create-api-client
    content: Create centralized API client (src/utils/apiClient.ts) with 401 handling, retry logic, and request queuing
    status: completed
  - id: create-error-types
    content: Create custom error types (src/utils/errors.ts) for better error classification and messages
    status: completed
  - id: enhance-use-auth
    content: Enhance useAuth hook with refresh queue, isRefreshing state, and background token refresh
    status: completed
  - id: update-use-friend-requests
    content: Update useFriendRequests hook to use apiClient instead of direct fetch
    status: completed
  - id: update-use-app-init
    content: Update useAppInitialization hook to use apiClient for check-profile call
    status: completed
  - id: update-use-product-sync
    content: Update useProductFeedSync hook to use apiClient for sync calls
    status: completed
  - id: update-use-friend-feed
    content: Update useFriendFeed hook to use apiClient for feed calls
    status: completed
  - id: update-main-app
    content: Update MainApp.tsx to use apiClient for profile fetch
    status: completed
  - id: update-profile-pages
    content: Update ProfilePage.tsx and ProfileEditPage.tsx to use apiClient
    status: completed
  - id: update-onboarding
    content: Update OnboardingPage.tsx to use apiClient for profile creation
    status: completed
  - id: update-feed-page
    content: Update FeedPage.tsx to use apiClient for feed operations
    status: completed
---

# Robust 401 Error Handling and Token Refresh

## Current Issues

1. **No automatic 401 handling** - API calls fail immediately on 401 without retry
2. **Inconsistent error handling** - Each component handles errors differently
3. **No retry logic** - Transient network failures cause permanent errors
4. **Token refresh only proactive** - No reactive refresh when 401 occurs
5. **No request queuing** - Multiple simultaneous requests can cause race conditions

## Solution Architecture

### 1. Create Centralized API Client (`src/utils/apiClient.ts`)

A wrapper around `fetch` that:

- Automatically handles 401 errors by refreshing token and retrying
- Implements exponential backoff retry logic for transient failures
- Queues requests during token refresh to prevent race conditions
- Provides consistent error handling across the app
- Supports request/response interceptors

**Key Features:**

- `apiRequest()` function that wraps all API calls
- Automatic token injection from `useAuth`
- 401 detection and automatic retry after token refresh
- Exponential backoff (1s, 2s, 4s) for retries
- Maximum 3 retry attempts
- Request queuing during token refresh

### 2. Enhance `useAuth` Hook

Add reactive token refresh capabilities:

- `refreshToken()` - Explicit token refresh function
- `isRefreshing` state - Track when token refresh is in progress
- Request queue management - Queue requests during refresh
- Better error handling for auth failures

**Changes to `src/hooks/useAuth.ts`:**

- Add `isRefreshing` state
- Add `refreshToken()` method
- Add request queue for pending API calls during refresh
- Improve error messages and error types

### 3. Background Token Refresh

Proactive token refresh before expiration:

- Check token expiration periodically (every 5 minutes)
- Refresh token when it expires within 1 hour (instead of 1 day)
- Silent refresh in background without user interruption

**Implementation:**

- Add `useEffect` in `useAuth` that checks token expiration
- Refresh token automatically when approaching expiration
- Update token refresh threshold from 1 day to 1 hour

### 4. Error Types and Handling

Create custom error types for better error handling:

- `AuthenticationError` - For 401/403 errors
- `NetworkError` - For network failures
- `ApiError` - For API errors (4xx, 5xx)
- `TokenExpiredError` - Specific error for expired tokens

**File: `src/utils/errors.ts`**

- Define error classes
- Provide user-friendly error messages
- Include error recovery suggestions

### 5. Update All API Calls

Migrate all direct `fetch` calls to use the new API client:

- `useFriendRequests.ts` - Replace `makeApiCall` with `apiClient`
- `useAppInitialization.ts` - Use `apiClient` for check-profile
- `MainApp.tsx` - Use `apiClient` for profile fetch
- `ProfilePage.tsx` - Use `apiClient` for profile fetch
- `ProfileEditPage.tsx` - Use `apiClient` for profile update
- `OnboardingPage.tsx` - Use `apiClient` for profile creation
- `useProductFeedSync.ts` - Use `apiClient` for sync
- `useFriendFeed.ts` - Use `apiClient` for feed fetch
- `FeedPage.tsx` - Use `apiClient` for feed operations

### 6. Error Recovery UI

Add user-friendly error handling:

- Toast notifications for transient errors (auto-dismiss)
- Retry buttons for recoverable errors
- Clear error messages (no technical jargon)
- Offline detection and messaging

**File: `src/components/ErrorToast.tsx`** (optional)

- Toast component for error notifications
- Auto-dismiss after 5 seconds
- Manual dismiss option

## Implementation Details

### API Client Structure

```typescript
// src/utils/apiClient.ts
interface ApiClientOptions {
  retries?: number
  retryDelay?: number
  timeout?: number
}

class ApiClient {
  private requestQueue: Array<() => Promise<any>> = []
  private isRefreshing = false
  
  async request(url: string, options: RequestInit): Promise<Response>
  private async handle401(url: string, options: RequestInit): Promise<Response>
  private async retryWithBackoff(fn: () => Promise<Response>): Promise<Response>
}
```

### Token Refresh Flow

1. API call receives 401
2. Check if token refresh already in progress
3. If yes, queue request and wait
4. If no, start token refresh
5. After refresh, retry original request
6. Process queued requests

### Retry Logic

- First retry: 1 second delay
- Second retry: 2 second delay  
- Third retry: 4 second delay
- Only retry on: 401, 429, 500, 502, 503, 504
- Don't retry on: 400, 403, 404 (client errors)

## Files to Create/Modify

**New Files:**

- `src/utils/apiClient.ts` - Centralized API client
- `src/utils/errors.ts` - Custom error types

**Modified Files:**

- `src/hooks/useAuth.ts` - Add refresh queue and reactive refresh
- `src/hooks/useFriendRequests.ts` - Use apiClient
- `src/hooks/useAppInitialization.ts` - Use apiClient
- `src/hooks/useProductFeedSync.ts` - Use apiClient
- `src/hooks/useFriendFeed.ts` - Use apiClient
- `src/pages/MainApp.tsx` - Use apiClient
- `src/pages/user_profile/ProfilePage.tsx` - Use apiClient
- `src/pages/user_profile/ProfileEditPage.tsx` - Use apiClient
- `src/pages/auth/OnboardingPage.tsx` - Use apiClient
- `src/pages/feeds/FeedPage.tsx` - Use apiClient

## Testing Considerations

- Test 401 handling with expired tokens
- Test concurrent requests during token refresh
- Test retry logic with network failures
- Test background token refresh
- Test error recovery scenarios
- Test offline handling

## Benefits

1. **Automatic Recovery** - 401 errors handled transparently
2. **Better UX** - Users don't see authentication errors
3. **Resilience** - Handles transient network failures
4. **Consistency** - All API calls use same error handling
5. **Maintainability** - Centralized logic easier to update
6. **Professional** - Production-ready error handling