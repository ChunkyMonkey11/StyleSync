# Minis Admin API Integration - Change Tracking

**Purpose:** Track all changes made during Minis Admin API integration for easy rollback if needed.

**Date Started:** 2025-01-04

---

## Files Modified

### 1. `supabase/functions/auth/index.ts`
**Status:** ✅ Completed
**Changes:**
- [x] Remove mock publicId generation (lines 48-61) - Replaced with Minis Admin API call
- [x] Add Minis Admin API GraphQL call using `userTokenVerify` mutation
- [x] Add database profile check after getting publicId
- [x] Update response structure to include `hasProfile` and `profile`
- [x] Add fallback to development mode if Admin API fails

**Key Changes:**
- Added imports: `createClient` from Supabase
- Added environment variables: `SHOP_MINIS_ADMIN_API_KEY`, `MINIS_ADMIN_API_URL`
- Replaced mock publicId generation with GraphQL call to Minis Admin API
- Added profile check query to `userprofiles` table
- Response now includes: `token`, `expiresIn`, `publicId`, `hasProfile`, `profile`

**Backup:** Original file can be restored by reverting to commit before changes

### 2. `src/hooks/useAuth.ts`
**Status:** ✅ Completed
**Changes:**
- [x] Update `AuthData` interface to include `publicId`, `hasProfile`, `profile`
- [x] Update auth response parsing to extract new fields
- [x] Store profile data in secure storage
- [x] Add `authData` state to track full auth response
- [x] Expose `authData` in hook return value

**Key Changes:**
- Extended `AuthData` interface with optional `publicId`, `hasProfile`, `profile`
- Updated response parsing to destructure `publicId`, `hasProfile`, `profile`
- Added `authData` state and `setAuthData` calls
- Return `authData` from hook for App.tsx to use

**Backup:** Original file can be restored by reverting to commit before changes

### 3. `src/App.tsx`
**Status:** ✅ Completed
**Changes:**
- [x] Use `hasProfile` from `authData` instead of separate `check-profile` call
- [x] Add useEffect to watch `authData` changes
- [x] Keep fallback to `check-profile` if `authData` not available

**Key Changes:**
- Added `authData` from `useAuth()` hook
- Added useEffect to set `hasProfile` when `authData` changes
- Modified `checkUserProfile` to use `authData.hasProfile` first, fallback to API call
- Maintains backward compatibility with existing flow

**Backup:** Original file can be restored by reverting to commit before changes

---

## Environment Variables Added

### `SHOP_MINIS_ADMIN_API_KEY`
**Location:** Supabase Edge Function secrets
**Command to add:** `npx supabase secrets set SHOP_MINIS_ADMIN_API_KEY=<your-key>`
**Command to remove:** `npx supabase secrets unset SHOP_MINIS_ADMIN_API_KEY`

---

## Rollback Instructions

If implementation doesn't work, revert changes in reverse order:

1. **Revert `src/App.tsx`** - Restore original `checkUserProfile` logic
   ```bash
   git checkout HEAD -- src/App.tsx
   ```

2. **Revert `src/hooks/useAuth.ts`** - Restore original response handling
   ```bash
   git checkout HEAD -- src/hooks/useAuth.ts
   ```

3. **Revert `supabase/functions/auth/index.ts`** - Restore mock publicId generation
   ```bash
   git checkout HEAD -- supabase/functions/auth/index.ts
   ```

4. **Remove environment variable** (if added)
   ```bash
   npx supabase secrets unset SHOP_MINIS_ADMIN_API_KEY
   ```

**Alternative:** Use git to revert all changes at once:
```bash
git diff HEAD -- src/App.tsx src/hooks/useAuth.ts supabase/functions/auth/index.ts
# Review changes, then:
git checkout HEAD -- src/App.tsx src/hooks/useAuth.ts supabase/functions/auth/index.ts
```

---

## Testing Notes

- [ ] Test with new user (no profile) - Should show onboarding
- [ ] Test with existing user (has profile) - Should load main app
- [ ] Test error handling (invalid token) - Should show error
- [ ] Test Admin API unavailable scenario - Should fallback to dev mode
- [ ] Test token caching - Should reuse stored token
- [ ] Test profile creation during onboarding - Should work with real publicId

## Implementation Status

✅ **Step 1:** Auth Edge Function updated with Minis Admin API integration
✅ **Step 2:** useAuth hook updated to handle new response structure  
✅ **Step 3:** App.tsx updated to use hasProfile from auth response
⏳ **Step 4:** Environment variable needs to be added (SHOP_MINIS_ADMIN_API_KEY)

## Next Steps

1. **Add Admin API Key to Supabase:**
   ```bash
   npx supabase secrets set SHOP_MINIS_ADMIN_API_KEY=<your-key>
   ```

2. **Deploy updated auth function:**
   ```bash
   npx supabase functions deploy auth --no-verify-jwt
   ```

3. **Test the flow:**
   - New user should see onboarding
   - Existing user should see main app
   - Check console logs for any errors

---

## Issues Encountered

None encountered during implementation. All changes completed successfully.

## Implementation Complete ✅

All code changes have been implemented and are ready for testing:

1. ✅ **Auth Function** (`supabase/functions/auth/index.ts`)
   - Calls Minis Admin API `userTokenVerify` mutation
   - Gets real `publicId` from Shopify
   - Checks database for existing profile
   - Returns `hasProfile` and `profile` in response
   - Falls back to dev mode if Admin API unavailable

2. ✅ **useAuth Hook** (`src/hooks/useAuth.ts`)
   - Handles new auth response structure
   - Stores `publicId`, `hasProfile`, `profile` in secure storage
   - Exposes `authData` for App.tsx to use

3. ✅ **App.tsx** (`src/App.tsx`)
   - Uses `hasProfile` from auth response
   - Falls back to `check-profile` API if needed
   - Maintains backward compatibility

## Summary

All code changes have been implemented:

1. ✅ **Auth Function** - Now calls Minis Admin API to get real publicId and checks profile
2. ✅ **useAuth Hook** - Handles new response structure and exposes authData
3. ✅ **App.tsx** - Uses hasProfile from auth response (with fallback)

**Remaining:** Add `SHOP_MINIS_ADMIN_API_KEY` environment variable to Supabase secrets before deploying.

---

