# 🧪 Testing the Onboarding Flow

**Date:** October 10, 2025  
**Status:** Ready to test!

---

## ✅ What's Been Completed

1. ✅ **Database** - `user_profiles` table created in Supabase
2. ✅ **Edge Functions** - Updated to use `user_profiles` table
   - `/create-profile` - Creates new profiles
   - `/check-username` - Validates username availability
3. ✅ **Frontend Service** - `userService.ts` created
4. ✅ **Form** - OnboardingForm simplified to minimal data collection
5. ✅ **Integration** - App.tsx wired to call API

---

## 🚀 How to Test

### 1. Make Sure Edge Functions Are Deployed

In your terminal:

```bash
cd shop-with-me

# Check if functions are deployed
supabase functions list

# If not deployed, deploy them:
supabase functions deploy create-profile
supabase functions deploy check-username
```

### 2. Make Sure Environment Variables Are Set

Check your `.env` file has:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Start the Development Server

```bash
npm run dev
```

### 4. Test the Flow

1. **Open the app** in your browser
2. **You should see** the OnboardingForm (simplified version)
3. **Fill out:**
   - Username (required, 3-20 chars, lowercase/numbers/_)
   - Bio (optional, max 150 chars)
4. **Click "Complete Setup"**

---

## ✅ Expected Results

### Success Case

**Console logs:**
```
📋 Creating user profile: { username: "yourname" }
📋 Received profile creation request
💾 Creating user profile: { username: "yourname" }
✅ Profile created successfully: <sync_id>
✅ Profile created successfully! <profile data>
```

**UI:**
- Form disappears
- Main app view shows
- Profile card displays:
  - Username
  - Bio
  - Sync ID
  - Profile picture (if from Shop SDK)

### Error Cases

**Duplicate Username:**
```
❌ Failed to create profile: Username already taken
```
- Error shows in form
- User can try different username

**Missing Shop User ID:**
```
❌ Failed to create profile: Shop user ID is required
```
- Shouldn't happen if Shop SDK is working

---

## 🐛 Troubleshooting

### "Edge function not found"

```bash
# Deploy the functions
cd shop-with-me
supabase functions deploy create-profile
supabase functions deploy check-username
```

### "Supabase credentials not found"

Check your `.env` file exists and has correct values:

```bash
# View environment variables
cat shop-with-me/.env
```

### "Table 'user_profiles' doesn't exist"

Run the migration again in Supabase SQL Editor.

### "Username already taken" but you're sure it's not

Clear the table:

```sql
-- ⚠️ WARNING: Deletes all profiles!
DELETE FROM user_profiles;
```

---

## 📊 Verify Data in Supabase

After creating a profile, check in Supabase Dashboard:

1. Go to **Table Editor**
2. Select **user_profiles** table
3. You should see your new profile with:
   - ✅ `sync_id` (auto-generated UUID)
   - ✅ `username` (lowercase)
   - ✅ `bio` (or null)
   - ✅ `pfp_url` (from Shop SDK or null)
   - ✅ `shop_user_id` (from Shop SDK)
   - ✅ `created_at` (auto-generated)
   - ✅ `updated_at` (auto-generated)

---

## 🔍 Testing Checklist

- [ ] Edge functions deployed
- [ ] Environment variables set
- [ ] Dev server running
- [ ] OnboardingForm appears
- [ ] Can enter username
- [ ] Can enter bio (optional)
- [ ] Submit button works
- [ ] Profile created in database
- [ ] Main app view shows after submission
- [ ] Profile data displays correctly
- [ ] Can't create duplicate username

---

## 🎯 What to Test

### Happy Path
1. ✅ Enter valid username (e.g., "testuser123")
2. ✅ Enter bio (optional)
3. ✅ Submit
4. ✅ See profile created
5. ✅ Refresh page - should see main app (not onboarding)

### Edge Cases
1. ✅ Username too short (< 3 chars) - should show error
2. ✅ Username too long (> 20 chars) - should show error
3. ✅ Username with spaces/special chars - should show error
4. ✅ Bio too long (> 150 chars) - should show error
5. ✅ Duplicate username - should show error
6. ✅ Empty bio - should work (optional)

---

## 📝 Test User Data

Try these test usernames:

```
testuser1
johndoe
stylefan2024
shopaholic_
user123
```

---

## 🎉 Success Criteria

You know it's working when:

1. ✅ Form submits without errors
2. ✅ Profile appears in Supabase `user_profiles` table
3. ✅ Main app view shows with correct data
4. ✅ Refreshing page keeps you logged in (shows main view)
5. ✅ Duplicate username is rejected
6. ✅ Console shows success messages

---

## 🚧 Known Limitations (For Now)

- ❌ No real-time username availability check (planned)
- ❌ No profile picture upload (uses Shop SDK avatar)
- ❌ No profile editing (planned)
- ❌ No user search yet (planned)
- ❌ No friends/sync feature yet (next phase)

---

## 📞 Next Steps After Testing

Once onboarding works:

1. **Build friend search** - Find users by username
2. **Build sync system** - Send/accept friend requests
3. **Build feed** - Show personal & friends' activity
4. **Build profile page** - View your profile & friends' profiles

---

**Ready to test? Let's go!** 🚀

---

**Last Updated:** October 10, 2025

