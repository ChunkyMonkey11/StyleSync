# Safari Web Inspector Setup Guide
**For Debugging Shop Minis in iOS Simulator**

---

## 🎯 What This Does

Safari Web Inspector lets you see:
- ✅ JavaScript console logs (all our emoji logs!)
- ✅ Network requests (API calls to Edge Functions)
- ✅ JavaScript errors and stack traces
- ✅ HTML/CSS structure
- ✅ Performance metrics

It's like Chrome DevTools but for the Shop App's webview.

---

## 📋 Prerequisites

- macOS with Safari
- Xcode with iOS Simulator
- Your Mini running in the simulator

---

## 🔧 Setup Steps

### **Step 1: Enable Web Inspector in Safari**

1. **Open Safari**

2. **Go to Safari Menu → Settings** (or press `⌘,`)

3. **Click "Advanced" tab** (rightmost tab)

4. **Check the box:** ✅ "Show features for web developers"
   - This will add a "Develop" menu to Safari's menu bar

5. **Close Settings**

---

### **Step 2: Start Your Mini in Simulator**

1. **Open Terminal**

2. **Navigate to your project:**
   ```bash
   cd /Users/revantpatel/StyleSync/style-sync
   ```

3. **Start the dev server:**
   ```bash
   npm start
   ```

4. **Wait for it to build** (you'll see "Build successful")

5. **Press `i` to open in iOS Simulator**

6. **Wait for Shop App to open** in the simulator

---

### **Step 3: Connect Safari Web Inspector**

1. **In Safari, click the "Develop" menu** (in menu bar)

2. **Look for your simulator name** (e.g., "iPhone 16 Pro")
   - Hover over it to see a submenu

3. **In the submenu, you'll see:**
   - localhost (your dev server)
   - Possibly multiple entries if other webviews are open

4. **Click on "localhost"** or the entry that matches your Mini

5. **A new Web Inspector window will open!**

---

## 🎯 What You'll See in Web Inspector

### **The Inspector Window Has Several Tabs:**

#### **1. Console Tab** 🔍 (Most Important!)
This is where all your logs appear, including:
- All our emoji-prefixed logs (🔍 ✅ ❌ 📱 🔐 etc.)
- JavaScript errors (in red)
- Warnings (in yellow)
- Network request logs

**What to look for:**
- The emoji trail showing your app's flow
- Any red error messages
- The last ✅ before the first ❌ (that's where it failed!)

#### **2. Network Tab** 📡
Shows all network requests:
- Fetches to your Edge Functions
- HTTP status codes
- Request/response headers
- Response bodies

**What to look for:**
- Failed requests (red, 4xx or 5xx status)
- CORS errors
- Slow requests
- 401 Unauthorized errors

#### **3. Sources Tab** 📄
Shows your source code files:
- App.tsx
- useAuth.ts
- etc.

**Useful for:**
- Setting breakpoints
- Stepping through code
- Viewing variable values

#### **4. Elements Tab** 🏗️
Shows the HTML structure:
- DOM tree
- Applied CSS styles
- Computed layout

**Useful for:**
- Checking if elements exist but are hidden
- Debugging CSS issues
- Inspecting the Error Boundary display

---

## 🔍 How to Use the Console

### **Filtering Logs**

In the Console tab, you can filter by:

1. **By text:** Type in the filter box
   - Type "App:" to see only App.tsx logs
   - Type "❌" to see only errors
   - Type "Auth" to see auth-related logs

2. **By log level:**
   - Click "Errors" to show only errors
   - Click "Warnings" to show warnings + errors
   - Click "All" to show everything

### **Expanding Objects**

When you see something like:
```
✅ App: Profile check result: {hasProfile: true}
```

Click the ▶️ arrow to expand and see full object details.

### **Clearing the Console**

Click the 🗑️ trash icon (top left) to clear old logs.

**Pro tip:** Clear it before testing, so you only see fresh logs!

---

## 📸 Reading the Emoji Trail

### **Example: Successful Load**

```javascript
🔍 App: Checking user profile...         // Started checking
🔐 App: Getting JWT token...             // Need authentication
ℹ️ No stored token found                 // No cached token
🔄 Fetching new JWT token...             // Getting new token
📱 Step 1: Generating Shop Mini token... // Using SDK
✅ Got Shop Mini token                   // SDK worked!
🔐 Step 2: Calling auth Edge Function... // Calling backend
📡 Auth response status: 200             // Success!
✅ Got JWT token                         // Have JWT now
💾 Token stored securely                 // Cached for later
✅ App: Got JWT token                    // Back to App
📡 App: Calling check-profile...         // Checking profile
📡 check-profile response status: 200    // Success!
✅ App: Profile check result: {...}      // Got result
✅ App: Profile check complete           // Done!
```

**Interpretation:** Everything worked perfectly! ✅

---

### **Example: Authentication Failed**

```javascript
🔍 App: Checking user profile...
🔐 App: Getting JWT token...
🔄 Fetching new JWT token...
📱 Step 1: Generating Shop Mini token...
❌ Failed to generate Shop Mini token: {...}
Error name: Error
Error message: Failed to generate Shop Mini token
Error stack: [full stack trace]
❌ App: Error checking profile: Error: Failed to generate Shop Mini token
```

**Interpretation:** The Shop Mini SDK couldn't generate a token. This means:
- Not running in actual Shop App
- OR SDK not initialized properly
- OR MinisContainer issue

**The failure point:** Between 📱 and the next step

---

### **Example: Edge Function Failed**

```javascript
🔍 App: Checking user profile...
🔐 App: Getting JWT token...
🔄 Fetching new JWT token...
📱 Step 1: Generating Shop Mini token...
✅ Got Shop Mini token, exchanging for JWT...
🔐 Step 2: Calling auth Edge Function...
Auth API URL: https://...supabase.co/functions/v1/auth
📡 Auth response status: 401
❌ Auth failed: 401 {"error":"Admin API request failed"}
❌ Authentication error: Error: Authentication failed: 401
```

**Interpretation:** Shop Mini token was generated, but Edge Function rejected it. This means:
- Wrong API key in Supabase secrets
- Edge Function not deployed correctly
- Token verification failing

**The failure point:** After 🔐 but during Edge Function call

---

## 🚨 Common Console Messages

### **Success Messages (Green ✅)**
- `✅ Loaded existing JWT token` - Using cached token
- `✅ Got Shop Mini token` - SDK working
- `✅ Got JWT token` - Authentication successful
- `✅ App: Profile check result` - API call successful

### **Info Messages (Blue ℹ️)**
- `ℹ️ No stored token found` - First time loading, normal
- `⏰ Stored token expired` - Token too old, will get new one

### **Warning Messages (Yellow ⚠️)**
- `⚠️ Could not parse stored token` - In localhost, mock data
- `⚠️ Token parse error` - Invalid token format

### **Error Messages (Red ❌)**
- `❌ Failed to generate Shop Mini token` - SDK issue
- `❌ Auth failed: 401` - Edge Function rejected token
- `❌ Authentication error` - General auth failure
- `❌ App: Error checking profile` - Profile check failed

---

## 🔧 Troubleshooting Web Inspector

### **Problem: Don't see "Develop" menu in Safari**
**Solution:** Go back to Step 1 and enable "Show features for web developers"

### **Problem: Don't see my simulator in Develop menu**
**Solution:**
- Make sure simulator is actually running
- Make sure Shop App is open in simulator
- Try clicking "Show Web Inspector" from Develop menu first
- Restart Safari

### **Problem: See multiple "localhost" entries**
**Solution:**
- Try each one until you find your Mini
- Look for the one that shows your app's console logs
- The others might be Vite dev server or other tools

### **Problem: Console is empty**
**Solution:**
- Make sure you're in the "Console" tab
- Try clicking "All" filter (not just "Errors")
- Reload the Mini in simulator
- Check if app is actually running

### **Problem: Inspector window closed accidentally**
**Solution:**
- Go back to Develop menu → [Simulator] → localhost
- OR press `⌘⌥I` while Safari is focused

---

## 📋 Debugging Checklist

Before testing:
- [ ] Safari has "Develop" menu enabled
- [ ] iOS Simulator is running
- [ ] Shop App is open in simulator
- [ ] `npm start` is running in terminal
- [ ] Mini is loaded in Shop App

When debugging:
- [ ] Web Inspector is connected
- [ ] Console tab is open
- [ ] "All" logs filter is selected
- [ ] Console is cleared (fresh start)
- [ ] Network tab is also open (to check requests)

While observing:
- [ ] Watch for emoji trail in console
- [ ] Note the last ✅ before first ❌
- [ ] Check Network tab for failed requests (red)
- [ ] Look for CORS errors
- [ ] Check response status codes

---

## 🎯 Quick Reference

**To open Web Inspector:**
1. Safari → Develop → [Your Simulator] → localhost

**To clear console:**
1. Click 🗑️ trash icon

**To filter console:**
1. Type in filter box or use log level buttons

**To view network requests:**
1. Click "Network" tab

**To find error details:**
1. Look for red ❌ emoji
2. Read error message
3. Click ▶️ to expand stack trace

---

## 💡 Pro Tips

1. **Keep console clear:** Clear before each test for easier reading

2. **Use filter:** Type keywords to find specific logs faster

3. **Check Network tab:** Failed requests show in red

4. **Expand everything:** Click all ▶️ arrows to see full details

5. **Take screenshots:** Capture the emoji trail for debugging

6. **Watch in real-time:** Keep Inspector open while Mini loads

7. **Check timestamps:** See how long each operation takes

---

## 🆘 Next Steps After Connecting

Once Inspector is connected:

1. **Reload the Mini** in simulator (swipe it closed and reopen)

2. **Watch the Console** as it loads

3. **Follow the emoji trail** from start to finish

4. **If it works:** You'll see all ✅ emojis! 🎉

5. **If it fails:** Note where the ❌ appears and share the logs

With Web Inspector connected, we can see EXACTLY what's happening! 🔍


