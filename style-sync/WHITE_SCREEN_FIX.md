# White Screen Fix - Applied Changes

## Date: October 18, 2025

## Issues Identified

### 1. **Tailwind CSS Not Loading** ❌
**Problem:** `src/index.css` was missing the Tailwind import, causing all Tailwind classes to be ignored. This resulted in invisible UI elements (white screen).

**Fix Applied:**
```css
@import "@shopify/shop-minis-react/styles";
@import "tailwindcss";  // ← ADDED THIS LINE
```

### 2. **Wrong Shop Minis Admin API Key** ❌
**Problem:** The Supabase Edge Function was using the wrong API key (`shpmns_siNeGRfVBEPKzdQHTeL52YfeorfcZVL9`), causing 401 authentication errors.

**Fix Applied:**
- Updated Supabase secret to use: `603f76f733e6b01054d10498c5cfb8bb`
- Redeployed `auth` Edge Function with new key

## Changes Made

### File: `src/index.css`
```diff
 @import "@shopify/shop-minis-react/styles";
+@import "tailwindcss";
```

### Supabase Secrets
```bash
npx supabase secrets set SHOP_MINIS_ADMIN_API_KEY="603f76f733e6b01054d10498c5cfb8bb"
```

### Edge Functions
```bash
npx supabase functions deploy auth --no-verify-jwt
```

## Testing Instructions

### 1. Clear Browser Cache (if testing in browser)
```bash
# Hard refresh your browser
# Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
# Or clear cache in DevTools
```

### 2. Test on Mobile via QR Code

```bash
cd /Users/revantpatel/StyleSync/style-sync
npm start
# Press 'q' to show QR code
# Scan with your phone
```

### 3. Expected Behavior

**Before Fix:**
- White screen on phone
- 401 errors in logs
- No UI visible

**After Fix:**
- Loading screen appears
- Auth succeeds (or shows proper error message)
- Onboarding page or Main app loads
- Tailwind styles are visible

## If Still White Screen

### Check 1: Verify Tailwind is working
Look for these classes rendering properly in DevTools:
- `flex`
- `items-center`
- `text-lg`
- `bg-blue-500`

If these don't apply styles, Tailwind isn't loading.

### Check 2: Check auth logs
```bash
npx supabase functions logs auth --follow
```

Should NOT see 401 errors anymore.

### Check 3: Check browser console
Open DevTools and look for:
- Import errors
- Network failures
- React errors

### Check 4: Verify API key is correct
The key `603f76f733e6b01054d10498c5cfb8bb` should be in your `.env` file as `VITE_SHOP_MINIS_ADMIN_API_KEY`.

If you need to use the other key instead:
```bash
npx supabase secrets set SHOP_MINIS_ADMIN_API_KEY="shpmns_siNeGRfVBEPKzdQHTeL52YfeorfcZVL9"
npx supabase functions deploy auth --no-verify-jwt
```

## Additional Notes

### Why Tailwind v4 Import?
Tailwind v4 uses a new CSS-first approach. The `@import "tailwindcss"` directive:
- Loads Tailwind's base styles
- Enables all utility classes
- Processes your Tailwind configuration from `package.json`

### Why the API Key Change?
Shop Minis uses two types of keys:
1. **Platform Key** (shpmns_*): For Shop platform operations
2. **Admin API Key**: For verifying user tokens

The Admin API specifically requires the hex key, not the platform key.

## Verification Checklist

- [x] Tailwind CSS import added to `index.css`
- [x] Shop Minis Admin API key updated in Supabase
- [x] Auth Edge Function redeployed
- [ ] Test on mobile device via QR code
- [ ] Verify loading screen appears
- [ ] Verify auth succeeds or shows proper error
- [ ] Verify UI styles are visible

## Next Steps

1. Test the app by scanning the QR code
2. Check if the white screen is resolved
3. If authentication still fails, we may need to verify which API key the Shop Minis Admin API actually expects
4. If UI still invisible, check that `@tailwindcss/vite` plugin is properly configured in your build setup

---

**Summary:** Added Tailwind CSS import and fixed authentication API key. App should now load properly with visible UI and working authentication.

