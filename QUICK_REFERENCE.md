# ⚡ StyleSync - Quick Reference Card

**Bookmark this page!** Fast access to everything you need.

---

## 🎯 Start Here (First Time?)

| Step | Document | Why |
|------|----------|-----|
| 1️⃣ | [NAVIGATION.md](NAVIGATION.md) | Understand folder structure |
| 2️⃣ | [README.md](README.md) | Get project overview |
| 3️⃣ | [docs/planning/PROJECT_NOTES.md](docs/planning/PROJECT_NOTES.md) | Deep dive into vision |

---

## 📂 Quick File Access

### Most Important Files

```
⭐⭐⭐ docs/planning/PROJECT_NOTES.md    ← Source of truth
⭐⭐  NAVIGATION.md                      ← Navigate the project
⭐   README.md                           ← Project overview
```

### Core Documentation

```
📋 docs/planning/Steps.txt              ← Original requirements
🔍 docs/research/hook-return-data.txt   ← Shop SDK data
🗄️ docs/database/clean-migration.sql    ← Database schema
```

### Application Code

```
💻 shop-with-me/src/App.tsx             ← Main app component
🎨 src/components/OnboardingForm.tsx    ← Onboarding (648 lines)
🪝 src/hooks/useAuth.ts                 ← Auth hook
📊 src/types.ts                         ← Type definitions
```

---

## 🗂️ Folder Shortcuts

| Shortcut | Path | Purpose |
|----------|------|---------|
| `docs/planning/` | Plans & decisions | Vision, requirements, decisions |
| `docs/research/` | Data & insights | Shop SDK data, user research |
| `docs/database/` | DB docs | Schemas, migrations |
| `src/components/` | UI components | React components |
| `src/services/` | Business logic | API calls, data operations |
| `src/utils/` | Helpers | Pure functions, utilities |
| `src/constants/` | Configuration | App config, validation rules |
| `src/hooks/` | Custom hooks | React hooks |
| `src/lib/` | Integrations | Supabase, third-party |
| `supabase/functions/` | Backend | Edge functions |

---

## 🔧 Common Tasks

### I want to...

**...understand the project vision**
```
→ docs/planning/PROJECT_NOTES.md
  Read sections: Project Vision, Product Phases
```

**...see what data we collect**
```
→ docs/planning/PROJECT_NOTES.md (User Profile Structure)
→ docs/research/hook-return-data.txt (actual data)
```

**...create a new component**
```
1. Create file in src/components/ComponentName.tsx
2. Check existing components for patterns
3. Import types from src/types.ts
```

**...add business logic**
```
1. Read src/services/README.md for patterns
2. Create src/services/serviceName.ts
3. Export from src/services/index.ts
```

**...add a helper function**
```
1. Read src/utils/README.md for patterns
2. Create src/utils/utilName.ts
3. Export from src/utils/index.ts
```

**...add configuration**
```
1. Read src/constants/README.md for patterns
2. Create src/constants/configName.ts
3. Export from src/constants/index.ts
```

**...work on database**
```
1. Read docs/database/README.md
2. Update docs/database/clean-migration.sql
3. Update supabase edge functions if needed
```

**...understand navigation**
```
→ NAVIGATION.md (comprehensive guide)
→ PROJECT_TREE.md (visual tree)
→ This file (quick reference)
```

---

## 💻 Development Commands

```bash
# Navigate to app
cd shop-with-me

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📝 File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `OnboardingForm.tsx` |
| Services | camelCase | `userService.ts` |
| Utils | camelCase | `formatters.ts` |
| Constants | camelCase | `appConfig.ts` |
| Hooks | use + PascalCase | `useAuth.ts` |
| Types | PascalCase | `UserProfile`, `Product` |

---

## 🎨 Code Import Patterns

```typescript
// Components
import { OnboardingForm } from '@/components/OnboardingForm';

// Services
import { createUserProfile } from '@/services/userService';
// or barrel import
import { createUserProfile } from '@/services';

// Utils
import { formatPrice } from '@/utils/formatters';
// or barrel import
import { formatPrice } from '@/utils';

// Constants
import { APP_NAME, LIMITS } from '@/constants/appConfig';
// or barrel import
import { APP_NAME, LIMITS } from '@/constants';

// Types
import type { UserProfile, Product } from '@/types';

// Hooks
import { useAuth } from '@/hooks/useAuth';

// Lib
import { supabase } from '@/lib/supabase';
```

---

## 🗄️ Database Quick Reference

### Tables (Planned)
- `users` - User profiles
- `connections` - Friend sync relationships
- `user_metadata` - Shop SDK data
- `activity_feed` - User actions

### Edge Functions
- `/auth` - Authentication
- `/check-username` - Username validation
- `/create-profile` - Profile creation
- `/user-profile` - Profile operations

---

## 🎯 Project Status

### ✅ Ready to Use
- Documentation structure
- Navigation guides
- Onboarding UI
- Supabase integration
- Auth system
- Empty folders with patterns

### 🚧 In Progress
- Database schema design
- Connecting onboarding to DB
- User profile system

### 📋 Planned
- Friend sync system
- Feed algorithm & UI
- Profile visualization
- Activity tracking

---

## 🔑 Key Concepts

### "Sync" Mechanic
- Mutual friend approval (not one-way)
- Access friend's curated feed
- See browsing, saves, purchases

### User Profile
- Username (unique)
- Bio, pfp, interests
- Shop SDK metadata
- Browsing/shopping history

### Feed System
- Personal curated feed
- Friends' activity feed
- Pull-to-refresh model
- Product-based content

---

## 📊 Project Stats

- **Total Documentation:** 10+ guides/READMEs
- **Total Components:** 2 (OnboardingForm, UsernameSelection)
- **Total Hooks:** 1 (useAuth)
- **Total Edge Functions:** 4 endpoints
- **Lines of Code:** ~900+ (components)

---

## 🆘 Troubleshooting

### Can't find something?
1. Check NAVIGATION.md
2. Use Cmd/Ctrl + P in editor to search files
3. Check folder READMEs for guidance

### Need context on a decision?
1. Check docs/planning/PROJECT_NOTES.md
2. Look in "Important Decisions Log" section
3. Check docs/planning/Steps.txt for original Q&A

### Need to understand data?
1. Check docs/research/hook-return-data.txt
2. Check src/types.ts for type definitions
3. Look at existing components for usage

### Don't know where to put code?
1. Check NAVIGATION.md "Where do I..." section
2. Read appropriate folder README
3. Follow existing patterns

---

## 💡 Pro Tips

1. 📌 **Bookmark NAVIGATION.md** - Most comprehensive guide
2. 📌 **Keep PROJECT_NOTES.md open** - Reference while coding
3. 📌 **Check folder READMEs** - Patterns and examples
4. 📌 **Use barrel exports** - Clean imports with index.ts
5. 📌 **Follow naming conventions** - Consistency matters
6. 📌 **Update docs as you go** - Future you will thank you
7. 📌 **Test in isolation** - Services and utils are pure
8. 📌 **Type everything** - TypeScript is your friend

---

## 🔗 Important Links

| Link | Purpose |
|------|---------|
| [NAVIGATION.md](NAVIGATION.md) | Complete navigation guide |
| [PROJECT_NOTES.md](docs/planning/PROJECT_NOTES.md) | Source of truth |
| [PROJECT_TREE.md](PROJECT_TREE.md) | Visual file tree |
| [RESTRUCTURE_SUMMARY.md](RESTRUCTURE_SUMMARY.md) | What changed |

---

## 📞 Quick Actions

```bash
# Find a file
grep -r "filename" .

# Search for text
grep -r "search term" src/

# See file structure
tree -L 3 -I 'node_modules|dist'

# Count lines of code
find src/ -name "*.tsx" -o -name "*.ts" | xargs wc -l
```

---

## 🎯 Next Steps

**Right now, the priority is:**
1. Design database schema
2. Connect onboarding to Supabase
3. Build user profile system

**See [PROJECT_NOTES.md](docs/planning/PROJECT_NOTES.md) for detailed roadmap.**

---

**Last Updated:** October 10, 2025  
**Keep this file handy for quick navigation!** 🚀

---

*Print this out or keep it open in a split pane while coding.*

