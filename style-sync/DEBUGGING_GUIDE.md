# StyleSync Debugging Guide
**After Implementing Shopify's Recommendations**

## ✅ What We've Implemented

### 1. Diagnostic Command ✅
Ran `npx shop-minis doctor` - **All dependencies and config are valid**

### 2. Error Boundary ✅
Added `ErrorBoundary` component that will:
- Catch any React errors
- Display detailed error messages
- Show stack traces
- Provide a "Try Again" button
- Log everything to console

**Location:** `src/components/ErrorBoundary.tsx`

### 3. Enhanced Logging ✅
Added comprehensive emoji-based logging to:
- `useAuth.ts` - Every step of JWT authentication
- `App.tsx` - Profile checking flow

**Log Prefixes:**
- 🔍 = Starting operation
- ✅ = Success
- ❌ = Error
- 📱 = Shop Mini SDK action
- 🔐 = Authentication action
- 📡 = Network request
- 💾 = Storage action
- ⚠️ = Warning
- ℹ️ = Info

---

## 🔍 How to Debug in Shop App

### Step 1: Open Safari Web Inspector

**On Mac with iOS Simulator:**

1. **Enable Web Inspector in Safari:**
   - Open Safari
   - Go to **Safari → Settings → Advanced**
   - Check ✅ "Show features for web developers"

2. **Start Your Mini:**
   ```bash
   cd /Users/revantpatel/StyleSync/style-sync
   npm start
   # Press 'i' for iOS Simulator
   ```

3. **Attach Web Inspector:**
   - In Safari menu bar: **Develop → [Your Simulator Name] → localhost**
   - You should see your Mini's webview
   - Click on it to open the console

4. **Watch the Console:**
   - All our emoji logs will appear here
   - Look for ❌ errors
   - Check Network tab for failed requests

---

### Step 2: Use Xcode Device Logs

**For deeper system-level debugging:**

1. **Open Xcode**

2. **Go to Window → Devices and Simulators**

3. **Select your running simulator**

4. **Click "Open Console" (bottom right)**

5. **Filter logs:**
   - Type "Shop" to see Shop App logs
   - Type "JavaScript" to see JS errors
   - Type "StyleSync" to see your app logs

---

### Step 3: Check for Specific Issues

#### A. If You See Error Boundary Screen
**Good!** This means:
- ✅ The app is loading
- ✅ React is rendering
- ❌ Something threw an error

**What to check:**
- Read the error message on screen
- Check Safari Web Inspector console
- Look for the emoji trail in logs (which step failed?)

#### B. If You See White Screen
**This means:**
- App loaded but UI isn't rendering
- OR app crashed before error boundary could catch it

**What to check:**
1. Safari Web Inspector console - any errors?
2. Xcode console - any native errors?
3. Look for CSS/styling issues
4. Check if network requests are blocked (CORS)

#### C. If You See "No Inspectable Contents" in Xcode
**This means:**
- App didn't load at all
- Build failed
- OR Shop App can't recognize the Mini

**What to check:**
1. Run `npx shop-minis doctor` again
2. Check if dev server is running (`npm start`)
3. Verify manifest.json is valid
4. Try clearing caches again

---

## 🔍 Reading the Emoji Trail

Our enhanced logging creates a **trail of breadcrumbs**. Here's what a successful flow looks like:

### Successful Authentication Flow:
```
🔍 App: Checking user profile...
🔐 App: Getting JWT token...
ℹ️ No stored token found
🔄 Fetching new JWT token...
📱 Step 1: Generating Shop Mini token...
✅ Got Shop Mini token, exchanging for JWT...
🔐 Step 2: Calling auth Edge Function...
Auth API URL: https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/auth
📡 Auth response status: 200
✅ Got JWT token, expires in 604800 seconds
💾 Token stored securely
✅ App: Got JWT token
📡 App: Calling check-profile Edge Function...
📡 App: check-profile response status: 200
✅ App: Profile check result: { hasProfile: true }
✅ App: Profile check complete
```

### If It Fails, You'll See:
```
🔍 App: Checking user profile...
🔐 App: Getting JWT token...
🔄 Fetching new JWT token...
📱 Step 1: Generating Shop Mini token...
❌ Failed to generate Shop Mini token: [error details]
❌ Authentication error: [error name/message/stack]
❌ App: Error checking profile: [error details]
```

**The last ✅ before the first ❌ tells you exactly where it failed!**

---

## 🚨 Common Issues & Solutions

### Issue 1: "Failed to generate Shop Mini token"
**Cause:** SDK not initialized or not in Shop App environment

**Solutions:**
- Make sure you're testing in actual Shop App (not just browser)
- Verify `MinisContainer` is wrapping your app
- Check if running in Simulator vs localhost

---

### Issue 2: "Authentication failed: 401"
**Cause:** Edge Function rejecting the Shop Mini token

**Solutions:**
- Verify `SHOP_MINIS_ADMIN_API_KEY` secret is correct
- Check Edge Function logs: `supabase functions logs auth`
- Ensure Edge Function is deployed with `--no-verify-jwt` flag
- Verify Shop Mini token is being sent correctly

---

### Issue 3: Network Request Fails (CORS Error)
**Cause:** CORS headers not set on Edge Functions

**Solutions:**
- Check Edge Function includes CORS headers
- Verify `trusted_domains` in manifest.json includes Supabase URL
- Check if OPTIONS request is handled

**Verify your Edge Functions have:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handle OPTIONS request
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders })
}

// Add to all responses
return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
})
```

---

### Issue 4: White Screen But No Errors
**Cause:** CSS not loading or invisible elements

**Solutions:**
- Verify `index.css` import order (Tailwind first, then Shop Minis)
- Check if Tailwind classes are applied
- Inspect elements in Safari Web Inspector
- Look for `display: none` or `opacity: 0`

---

## 📊 Debugging Checklist

Before contacting Shopify support, verify:

- [ ] `npx shop-minis doctor` shows all green
- [ ] Safari Web Inspector is connected and showing logs
- [ ] Dev server is running (`npm start`)
- [ ] Testing in actual Shop App (not browser)
- [ ] Error Boundary is wrapped around app
- [ ] Checked console for emoji trail
- [ ] Checked Xcode device logs
- [ ] Verified Edge Functions are deployed
- [ ] Verified Supabase secrets are set
- [ ] Checked CORS headers on Edge Functions
- [ ] Verified `trusted_domains` in manifest.json

---

## 🎯 Next Steps

1. **Run the Mini** with all this debugging in place:
   ```bash
   npm start
   # Press 'i' for iOS Simulator
   ```

2. **Open Safari Web Inspector** immediately

3. **Watch the console** as the Mini loads

4. **Take screenshots** of:
   - Safari Web Inspector console (with any errors)
   - Xcode device logs (if any native errors)
   - The Mini screen (error boundary or white screen)

5. **Share those screenshots** with Shopify support or me for further debugging

---

## 🆘 If Still Stuck

With all this debugging in place, you should see EXACTLY where it fails. Share:

1. The emoji trail from console (last ✅ before ❌)
2. Any error messages from Error Boundary
3. Network tab in Safari Web Inspector (failed requests?)
4. Any CORS errors or 401/403/500 responses

This will give us pinpoint accuracy on what's failing!


