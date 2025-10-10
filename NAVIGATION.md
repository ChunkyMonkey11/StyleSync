# 🗺️ StyleSync - Project Navigation Guide

**Quick Reference:** Use this guide to understand the project structure and find what you need.

---

## 📁 Root Directory Structure

```
StyleSync/
├── 📄 NAVIGATION.md           ← YOU ARE HERE (navigation guide)
├── 📂 docs/                   ← All documentation
├── 📂 shop-with-me/           ← Main application code
└── 📄 .gitignore
```

---

## 📚 Documentation (`/docs`)

### Structure
```
docs/
├── 📂 planning/               ← Project planning & decisions
│   ├── PROJECT_NOTES.md      ← MAIN reference document (read this first!)
│   └── Steps.txt             ← Original project steps & Q&A
├── 📂 research/               ← Data analysis & insights
│   └── hook-return-data.txt  ← Shop SDK hooks data analysis
└── 📂 database/               ← Database schemas & migrations
    └── clean-migration.sql   ← Database migration file
```

### Key Files to Know

#### 🎯 [docs/planning/PROJECT_NOTES.md](docs/planning/PROJECT_NOTES.md)
**READ THIS FIRST!** - Living document with:
- Complete project vision (all phases)
- Technical decisions & architecture
- User profile structure
- Sync mechanics explained
- Open questions & decisions log
- Current project state

#### 📝 [docs/planning/Steps.txt](docs/planning/Steps.txt)
- Original project requirements
- User profile fields defined
- Q&A about features & mechanics

#### 🔍 [docs/research/hook-return-data.txt](docs/research/hook-return-data.txt)
- Shop SDK hooks return data examples
- `useRecentProducts()` - 20 items
- `useSavedProducts()` - 13 items
- Data structure analysis
- Insights for feed algorithm

#### 🗄️ [docs/database/clean-migration.sql](docs/database/clean-migration.sql)
- Database migration file
- Table schemas (when created)

---

## 🚀 Application Code (`/shop-with-me`)

### High-Level Structure
```
shop-with-me/
├── 📂 src/                    ← Source code (main work happens here)
├── 📂 supabase/               ← Supabase edge functions
├── 📂 dist/                   ← Build output (generated)
├── 📂 node_modules/           ← Dependencies (don't touch)
├── 📄 package.json            ← Dependencies & scripts
├── 📄 tsconfig.json           ← TypeScript config
├── 📄 vite.config.mjs         ← Build config
└── 📄 index.html              ← Entry HTML
```

---

## 💻 Source Code (`/shop-with-me/src`)

### Complete Structure
```
src/
├── 📂 components/             ← React components
│   ├── OnboardingForm.tsx    ← Main onboarding form (648 lines)
│   └── UsernameSelection.tsx ← Username picker component
├── 📂 hooks/                  ← Custom React hooks
│   └── useAuth.ts            ← Authentication hook
├── 📂 lib/                    ← Third-party integrations
│   └── supabase.ts           ← Supabase client setup
├── 📂 services/               ← Business logic & API calls
│   └── (empty - ready for use)
├── 📂 utils/                  ← Helper functions & utilities
│   └── (empty - ready for use)
├── 📂 constants/              ← App constants & config
│   └── (empty - ready for use)
├── 📄 App.tsx                 ← Main app component
├── 📄 main.tsx                ← App entry point
├── 📄 types.ts                ← TypeScript type definitions
├── 📄 index.css               ← Global styles
├── 📄 env.d.ts                ← Environment type definitions
├── 📄 manifest.json           ← Shop Mini manifest
└── 🖼️ icon.png               ← App icon
```

### Key Files

#### 🎨 Components (`/src/components`)
- **OnboardingForm.tsx** - Main onboarding experience
  - Collects username, bio, pfp, interests
  - Uses Shop SDK hooks (useBuyerAttributes, useCurrentUser, useRecentProducts, useSavedProducts)
  - LinkedIn-style interest bubbles
  - Currently: UI only (not storing data yet)

- **UsernameSelection.tsx** - Username picker component
  - Ensures unique usernames
  - Part of onboarding flow

#### 🪝 Hooks (`/src/hooks`)
- **useAuth.ts** - Authentication logic
  - Manages user session
  - Integrates with Supabase auth

#### 📚 Lib (`/src/lib`)
- **supabase.ts** - Supabase client initialization
  - Database connection
  - Auth configuration

#### 🔧 Services (`/src/services`)
**Ready for:**
- User profile service
- Feed service
- Sync/connection service
- Product service

#### 🛠️ Utils (`/src/utils`)
**Ready for:**
- Data formatting helpers
- Validation functions
- Date/time utilities
- Shop SDK data parsers

#### ⚙️ Constants (`/src/constants`)
**Ready for:**
- API endpoints
- App configuration
- Feature flags
- Default values

---

## ⚡ Supabase Functions (`/shop-with-me/supabase`)

### Structure
```
supabase/
├── 📂 functions/
│   ├── 📂 _shared/            ← Shared utilities
│   │   ├── cors.ts           ← CORS handling
│   │   ├── jwt-utils.ts      ← JWT token utilities
│   │   └── responses.ts      ← Response helpers
│   ├── 📂 auth/              ← Authentication endpoints
│   │   └── index.ts
│   ├── 📂 check-username/    ← Username validation endpoint
│   │   └── index.ts
│   ├── 📂 create-profile/    ← Profile creation endpoint
│   │   └── index.ts
│   └── 📂 user-profile/      ← User profile endpoints
│       └── index.ts
```

### Edge Functions Explained
- **auth/** - Handle user authentication
- **check-username/** - Validate username uniqueness
- **create-profile/** - Create new user profiles
- **user-profile/** - Get/update user profile data

---

## 🎯 Quick Access Paths

### Working on Onboarding?
```
📁 /shop-with-me/src/components/OnboardingForm.tsx
📁 /shop-with-me/src/components/UsernameSelection.tsx
📁 /docs/planning/PROJECT_NOTES.md (user profile structure)
```

### Building Database Schema?
```
📁 /docs/database/
📁 /docs/planning/PROJECT_NOTES.md (see "User Profile Structure")
📁 /shop-with-me/supabase/functions/
```

### Understanding Data Collection?
```
📁 /docs/research/hook-return-data.txt
📁 /shop-with-me/src/components/OnboardingForm.tsx (see hooks usage)
```

### Need Project Context?
```
📁 /docs/planning/PROJECT_NOTES.md ← START HERE
📁 /docs/planning/Steps.txt
```

### Building New Features?
```
📁 /shop-with-me/src/components/ (UI components)
📁 /shop-with-me/src/services/ (business logic)
📁 /shop-with-me/src/hooks/ (custom hooks)
```

---

## 🔍 Finding Specific Things

### "Where do I..."

**...understand the project vision?**
→ `/docs/planning/PROJECT_NOTES.md`

**...see what user data we collect?**
→ `/docs/planning/PROJECT_NOTES.md` (User Profile Structure section)
→ `/docs/research/hook-return-data.txt` (actual Shop SDK data)

**...find the onboarding form?**
→ `/shop-with-me/src/components/OnboardingForm.tsx`

**...see database stuff?**
→ `/docs/database/` (schemas & migrations)
→ `/shop-with-me/supabase/functions/` (backend logic)

**...add a new component?**
→ `/shop-with-me/src/components/` (create new file here)

**...add business logic?**
→ `/shop-with-me/src/services/` (create service files)

**...add helper functions?**
→ `/shop-with-me/src/utils/` (create utility files)

**...configure the app?**
→ `/shop-with-me/src/constants/` (add config files)

**...see what decisions were made?**
→ `/docs/planning/PROJECT_NOTES.md` (Important Decisions Log section)

---

## 📋 Common Workflows

### Starting a new feature
1. Read `/docs/planning/PROJECT_NOTES.md` for context
2. Create component in `/shop-with-me/src/components/`
3. Add business logic in `/shop-with-me/src/services/`
4. Create custom hooks if needed in `/shop-with-me/src/hooks/`
5. Update types in `/shop-with-me/src/types.ts`

### Working with database
1. Design schema (document in `/docs/database/`)
2. Create migration file in `/docs/database/`
3. Build edge functions in `/shop-with-me/supabase/functions/`
4. Create service layer in `/shop-with-me/src/services/`
5. Use in components

### Understanding data
1. Check `/docs/research/hook-return-data.txt` for Shop SDK data structure
2. See how it's used in `/shop-with-me/src/components/OnboardingForm.tsx`
3. Reference types in `/shop-with-me/src/types.ts`

---

## 🎨 File Naming Conventions

### Components
- **PascalCase** for component files: `OnboardingForm.tsx`, `UserProfile.tsx`
- One component per file
- Co-locate styles if component-specific

### Services
- **camelCase** for service files: `userService.ts`, `feedService.ts`
- Group related functions in same service

### Hooks
- **camelCase** starting with "use": `useAuth.ts`, `useProfile.ts`
- Follow React hooks naming convention

### Utils
- **camelCase** for utility files: `formatters.ts`, `validators.ts`
- Group related utilities

### Constants
- **SCREAMING_SNAKE_CASE** for constants inside files
- **camelCase** for constant files: `apiConfig.ts`, `appSettings.ts`

---

## 🚦 Status Legend

Current project status by folder:

| Folder | Status | Description |
|--------|--------|-------------|
| 📂 docs/planning | ✅ Active | Living documentation - update regularly |
| 📂 docs/research | ✅ Complete | Reference data - read-only |
| 📂 docs/database | 🚧 Ready | Add schemas & migrations here |
| 📂 src/components | 🚧 In Progress | Onboarding done, more to come |
| 📂 src/hooks | 🚧 Started | useAuth exists, add more |
| 📂 src/lib | ✅ Setup | Supabase configured |
| 📂 src/services | ⚪ Empty | Ready for business logic |
| 📂 src/utils | ⚪ Empty | Ready for helpers |
| 📂 src/constants | ⚪ Empty | Ready for config |
| 📂 supabase/functions | ✅ Setup | Edge functions scaffolded |

---

## 💡 Pro Tips

1. **Always start with** `/docs/planning/PROJECT_NOTES.md` when working on something new
2. **Update PROJECT_NOTES.md** when making important decisions
3. **Keep this NAVIGATION.md handy** - bookmark it!
4. **Use the Quick Access Paths** section above to jump to what you need
5. **Follow naming conventions** to keep the codebase consistent
6. **Document as you go** - future you will thank present you

---

## 🆘 Need Help?

If you can't find something:
1. Search this file (NAVIGATION.md) for keywords
2. Check `/docs/planning/PROJECT_NOTES.md` for project context
3. Look at existing files for patterns (especially in `/src/components`)

---

**Last Updated:** October 10, 2025  
**Maintained by:** Project Team  
**Update this file** when folder structure changes!

