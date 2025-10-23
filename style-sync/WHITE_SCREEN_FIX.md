## Problem

The Shop Mini when run on the shop platform would always result in a white screen.

- The tab that lays above a developing shop app to reload and other features was not appearing
- No rendering of the root App.tsx
- Issue persisted no matter what Cursor had attempted to try

## Solution

- Sent the shop development team a zip file that contained the style-sync app without the node modules
- They sent us back this feedback from Steve:

---

**Steve's Feedback:**

Ok so there's a couple of issues:

1. **manifest.json scopes includes email and offline_access which do not exist and should be removed.**

```json
"scopes": [
    "user_settings:read",
    "openid",
    "profile",
    "email",
    "offline_access"
],
```

Should be:

```json
"scopes": [
    "user_settings:read",
    "openid",
    "profile"
],
```

2. **manifest.json trusted_domains includes https:// which should be removed.**

```json
"trusted_domains": ["https://fhyisvyhahqxryanjnby.supabase.co"]
```

Should be:

```json
"trusted_domains": ["fhyisvyhahqxryanjnby.supabase.co"]
```

You can run the following command to validate the manifest is correct:
```bash
npx shop-minis validate-manifest
```

3. **You need to delete your vite.config.mjs file** - it is no longer required and causes issues when included.

After doing that, you should be able to run the mini again and it will work. 