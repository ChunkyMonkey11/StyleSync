# 🔄 Database Migration Steps - Option 3 Implementation

## 📋 Overview
We've removed the dependency on Shop SDK's `shop_user_id` since it doesn't actually provide a stable user ID. Instead, we're using:
- **Primary Identifier:** `sync_id` (UUID, auto-generated)
- **Session Persistence:** Local storage (`stylesync_username`)
- **Shop SDK Data:** `display_name` and `pfp_url` (both optional)

---

## ✅ **Code Changes (Already Done)**

All code has been updated:
- ✅ `OnboardingForm.tsx` - Now collects `display_name` instead of `shop_user_id`
- ✅ `App.tsx` - Uses local storage to persist user session
- ✅ `userService.ts` - Updated `UserProfile` type
- ✅ `create-profile/standalone.ts` - Updated edge function validation
- ✅ `clean-migration.sql` - Updated schema
- ✅ `PROJECT_NOTES.md` - Documented the changes

---

## 🔧 **What YOU Need to Do:**

### **Step 1: Update Database Schema in Supabase**

Go to your Supabase Dashboard → SQL Editor and run these commands:

```sql
-- Add display_name column
ALTER TABLE user_profiles 
ADD COLUMN display_name VARCHAR(100);

-- Make shop_user_id nullable (or drop it entirely)
ALTER TABLE user_profiles 
ALTER COLUMN shop_user_id DROP NOT NULL;

-- Optional: Drop the shop_user_id column entirely if you want
-- ALTER TABLE user_profiles DROP COLUMN shop_user_id;

-- Drop the old index for shop_user_id if it exists
DROP INDEX IF EXISTS idx_user_profiles_shop_user_id;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles';
```

**Expected Output:**
```
column_name    | data_type          | is_nullable
---------------|-------------------|-------------
sync_id        | uuid              | NO
username       | character varying | NO
bio            | character varying | YES
display_name   | character varying | YES
pfp_url        | text              | YES
shop_user_id   | text              | YES (or removed)
created_at     | timestamp...      | YES
updated_at     | timestamp...      | YES
```

---

### **Step 2: Redeploy Edge Function**

1. **Go to:** Supabase Dashboard → Edge Functions → `create-profile`
2. **Copy the entire contents** of: `shop-with-me/supabase/functions/create-profile/standalone.ts`
3. **Paste** into the Supabase editor (replacing the old code)
4. **Click "Deploy"**

**What Changed in Edge Function:**
- Removed validation for `shop_user_id` (no longer required)
- Now accepts `display_name` (optional)
- Updated insert data to use new schema

---

### **Step 3: Test the Flow**

1. **Clear your local storage** (to simulate a new user):
   - In Safari Web Inspector: Storage → Local Storage → Delete `stylesync_username`
   - Or in the app, run: `localStorage.clear()`

2. **Reload the app** - you should see the onboarding form

3. **Check the debug panel** - it should show:
   ```
   Extracted displayName: Revant
   Extracted pfpUrl: https://cdn.shopify.com/...
   ```

4. **Fill out the form:**
   - Enter a username (e.g., `testuser123`)
   - Enter a bio (optional)
   - Click "Create Profile"

5. **Verify success:**
   - Should see "✅ Profile created successfully!" in console
   - Should navigate to main view
   - Local storage should have: `stylesync_username = testuser123`

6. **Test persistence:**
   - Reload the app
   - Should automatically load your profile (not show onboarding)

7. **Check database:**
   - Go to Supabase → Table Editor → `user_profiles`
   - You should see your new profile with `display_name` populated

---

## 🎯 **What This Solves:**

### **Before (Broken):**
```
useCurrentUser() → { displayName, avatarImage }
                     ❌ NO 'id' field!
                     
Code tried: currentUser.id → undefined → ERROR
```

### **After (Working):**
```
useCurrentUser() → { displayName, avatarImage }
                     ✅ Extract what's available
                     
Code uses:
- displayName → display_name (optional)
- avatarImage.url → pfp_url (optional)
- localStorage → session persistence
- sync_id (UUID) → primary identifier
```

---

## 🔍 **How It Works Now:**

### **First Visit (New User):**
1. App checks `localStorage.getItem('stylesync_username')` → null
2. Shows onboarding form
3. User creates profile → saves to database
4. Stores username in local storage: `localStorage.setItem('stylesync_username', 'testuser123')`
5. Navigates to main view

### **Return Visit (Existing User):**
1. App checks `localStorage.getItem('stylesync_username')` → `'testuser123'`
2. Queries database: `getUserProfileByUsername('testuser123')`
3. Loads profile and goes directly to main view
4. No onboarding needed!

### **Different Device/Browser:**
1. Local storage is empty
2. Shows onboarding again
3. User can create a NEW profile OR we could add "Sign In" flow later

---

## 📝 **Notes:**

- **Local Storage Limitation:** Clears when user uninstalls Shop app or clears browser data
  - This is normal for Mini apps
  - Future: Could add "Sign In" feature to recover existing profiles
  
- **Display Name:** Optional because Shop SDK might not always provide it
  - If user has no display name in Shop, it'll be null in our DB
  - Not a problem since username is what matters

- **No More shop_user_id:** We don't need it since Shop doesn't provide one anyway!
  - `sync_id` is our source of truth
  - Each profile is uniquely identified by UUID + username

---

## 🚀 **After This Works:**

Next steps in order:
1. ✅ Remove debug panel from UI
2. ✅ Add real-time username validation
3. ✅ Polish onboarding UX
4. ✅ Build friend system (Phase B)

---

*Last Updated: October 10, 2025 - Option 3 Implementation Complete*

