# Edge Functions Deployment Guide

## Migration Complete! ✅

Your Shop Mini has been successfully migrated from direct Supabase calls to secure Edge Functions.

## What Changed

### New Files Created
1. **`src/hooks/useAuth.ts`** - JWT authentication hook
2. **`supabase/functions/check-profile/index.ts`** - Profile checking Edge Function
3. **`supabase/functions/create-profile/index.ts`** - Profile creation Edge Function (already created)

### Files Updated
1. **`src/App.tsx`** - Now uses Edge Function to check profiles
2. **`src/pages/OnboardingPage.tsx`** - Now uses Edge Function to create profiles

### Files Deleted
1. **`src/lib/supabase.ts`** - No longer needed (all DB access via Edge Functions)

## Deployment Steps

### 1. Deploy check-profile Edge Function

From the `style-sync` directory, run:

```bash
cd /Users/revantpatel/StyleSync/style-sync
npx supabase functions deploy check-profile --no-verify-jwt
```

You should see:
```
✓ Deployed function check-profile
```

### 2. Verify Deployment

Check that both Edge Functions are deployed:

```bash
npx supabase functions list
```

You should see:
- `auth` ✓
- `create-profile` ✓
- `check-profile` ✓

### 3. Test the App

Start your development server:

```bash
npm start
```

Then press `i` to open in iOS Simulator or `a` for Android.

## How It Works Now

### Authentication Flow
```
1. App loads → useAuth hook activates
2. useAuth gets Shop Mini token → exchanges for JWT
3. JWT stored securely (not localStorage)
4. JWT used for all API calls
```

### Profile Check Flow (App.tsx)
```
1. User opens app
2. App.tsx calls getValidToken() → gets JWT
3. Calls check-profile Edge Function with JWT
4. Edge Function verifies JWT → queries database
5. Returns: hasProfile: true/false
6. Routes to MainApp or OnboardingPage
```

### Profile Creation Flow (OnboardingPage.tsx)
```
1. User fills out form
2. OnboardingPage calls getValidToken() → gets JWT
3. Calls create-profile Edge Function with JWT + profile data
4. Edge Function:
   - Verifies JWT
   - Extracts publicId from JWT (security!)
   - Inserts profile with correct shop_public_id
5. Returns created profile
6. Routes to MainApp
```

## Security Improvements

✅ **No direct database access** - Client can't bypass validation
✅ **JWT verification** - All requests authenticated
✅ **Server-side publicId** - Users can't impersonate others
✅ **Secure storage** - Tokens stored using Shop Minis secure storage API
✅ **No localStorage** - Compliant with Shop Minis requirements

## API Endpoints

Your Edge Functions are available at:

- **Auth:** `https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/auth`
- **Check Profile:** `https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/check-profile`
- **Create Profile:** `https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/create-profile`

## Troubleshooting

### "Missing authorization header" error
- Make sure useAuth hook is being called
- Check that JWT token is being generated

### "Invalid or expired token" error
- JWT tokens expire after 7 days
- useAuth automatically refreshes tokens when needed
- Check that JWT_SECRET_KEY is set in Supabase secrets

### Check logs
```bash
# View logs for specific function
npx supabase functions logs check-profile --follow
npx supabase functions logs create-profile --follow
```

## Next Steps

1. Deploy the check-profile function (command above)
2. Test the app in Shop App simulator
3. Create additional Edge Functions as needed (e.g., get-friends, add-friend)

## Environment Variables

These are automatically available in Edge Functions:
- `SUPABASE_URL` - Auto-injected by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-injected by Supabase
- `JWT_SECRET_KEY` - Set via `supabase secrets set`
- `SHOP_MINIS_ADMIN_API_KEY` - Set via `supabase secrets set`

No changes needed to these!

