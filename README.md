# 🎨 StyleSync

**A social commerce platform for Shop Mini where friends connect, discover, and share their shopping journey.**

---

## 👉 **[START HERE](START_HERE.md)** 👈

**New to the project?** Click above for the complete onboarding guide!

---

## 🚀 Quick Start

1. **First Time Here?** Read [📍 START_HERE.md](START_HERE.md) for the complete guide
2. **Need Navigation?** Check [📍 NAVIGATION.md](NAVIGATION.md) to understand the structure
3. **Understand the Vision?** See [📋 PROJECT_NOTES.md](docs/planning/PROJECT_NOTES.md)
4. **Ready to Code?** See [Development Setup](#development-setup) below

---

## 📖 What is StyleSync?

StyleSync lets users "sync" with friends to:
- 👀 See what friends are browsing and buying on Shop
- 🛍️ Discover products through their network
- 💬 Share and discuss products (future)
- 🌟 Follow influencers and discover their style (future)

**Think:** Letterboxd/BeReal but for shopping.

---

## 🗂️ Project Structure

```
StyleSync/
├── 📄 NAVIGATION.md           ← Start here to navigate the project
├── 📂 docs/                   ← All documentation
│   ├── planning/             ← Project plans & decisions
│   ├── research/             ← Data analysis
│   └── database/             ← DB schemas & migrations
└── 📂 shop-with-me/           ← Main application
    ├── src/                  ← Source code
    └── supabase/             ← Backend functions
```

**👉 See [NAVIGATION.md](NAVIGATION.md) for detailed file structure**

---

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript
- **Platform:** Shop Mini SDK (Shopify)
- **Backend:** Supabase (Database + Auth + Edge Functions)
- **Build:** Vite
- **Styling:** CSS

---

## 💻 Development Setup

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Supabase CLI (for local development)

### Installation

```bash
# Navigate to app directory
cd shop-with-me

# Install dependencies
npm install

# Run development server
npm run dev
```

### Environment Variables
Create a `.env` file in `/shop-with-me`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

---

## 📚 Important Documentation

| Document | Purpose |
|----------|---------|
| [NAVIGATION.md](NAVIGATION.md) | Navigate the project structure |
| [PROJECT_NOTES.md](docs/planning/PROJECT_NOTES.md) | Complete project reference & decisions |
| [Steps.txt](docs/planning/Steps.txt) | Original requirements & Q&A |
| [hook-return-data.txt](docs/research/hook-return-data.txt) | Shop SDK data analysis |

---

## 🎯 Current Status

### ✅ Completed
- Project structure setup
- Onboarding form UI
- Username selection component
- Supabase integration
- Documentation foundation

### 🚧 In Progress
- Database schema design
- Connecting onboarding to Supabase
- User profile system

### 📋 Planned
- Friend sync/connection system
- Feed algorithm & UI
- Profile visualization
- Activity tracking

---

## 🤝 Core Concepts

### "Sync" Mechanic
- Mutual friend approval (not one-way following)
- Access to friend's curated feed
- See their browsing, saves, and purchases

### User Profile
- Username (unique)
- Bio & profile picture
- Interest tags (LinkedIn-style bubbles)
- Shopping behavior metadata from Shop SDK

### Feed System
- Personal curated feed (based on preferences)
- Friends' activity feed (what they're shopping)
- Pull-to-refresh model

---

## 📦 Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Build
npm run build        # Production build
npm run preview      # Preview production build

# Linting & Type Checking
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

---

## 🗄️ Database

- **Provider:** Supabase (PostgreSQL)
- **Migrations:** Located in `docs/database/`
- **Edge Functions:** Located in `shop-with-me/supabase/functions/`

See [docs/database/](docs/database/) for schema documentation.

---

## 🔐 Authentication

Authentication is handled by Supabase Auth with Shop Mini integration.

- Auth hook: `src/hooks/useAuth.ts`
- Edge function: `supabase/functions/auth/`

---

## 📱 Shop Mini Integration

The app uses Shop Mini SDK hooks for user data:

- `useRecentProducts()` - Browsing history (20 items)
- `useSavedProducts()` - Favorited items (13+ items)
- `useBuyerAttributes()` - User metadata
- `useCurrentUser()` - Current user info

See [hook-return-data.txt](docs/research/hook-return-data.txt) for data structure.

---

## 🧭 Getting Oriented

**New to the project?**
1. Read [NAVIGATION.md](NAVIGATION.md) - understand folder structure
2. Read [PROJECT_NOTES.md](docs/planning/PROJECT_NOTES.md) - understand vision & decisions
3. Check current components in `shop-with-me/src/components/`
4. Start building!

**Working on a feature?**
1. Check [PROJECT_NOTES.md](docs/planning/PROJECT_NOTES.md) for context
2. Navigate using [NAVIGATION.md](NAVIGATION.md)
3. Update documentation as you go

---

## 🎨 Design Principles

- **Friction-free:** Quick onboarding, easy discovery
- **Social-first:** Friends are at the center
- **Privacy-aware:** User control over data (Phase 2+)
- **Visual:** Creative profile visualization (islands/closets concept)

---

## 🚀 Roadmap

### Phase 1: Social Shopping Network (Current)
- User profiles & onboarding
- Mutual sync connections
- Personal & friend feeds
- Profile visualization

### Phase 2: Social Proof
- Product posts & discussions
- Friend feedback/opinions
- Community forums

### Phase 3: Influencer Economy
- Verified influencer accounts
- Public influencer feeds
- Affiliate partnerships

---

## 📝 Contributing

When working on this project:
- Follow naming conventions (see [NAVIGATION.md](NAVIGATION.md))
- Update [PROJECT_NOTES.md](docs/planning/PROJECT_NOTES.md) for important decisions
- Document new features
- Keep code organized in appropriate folders

---

## 🆘 Need Help?

1. **Can't find something?** → Check [NAVIGATION.md](NAVIGATION.md)
2. **Need context?** → Read [PROJECT_NOTES.md](docs/planning/PROJECT_NOTES.md)
3. **Understanding data?** → See [hook-return-data.txt](docs/research/hook-return-data.txt)

---

## 📄 License

[Add license information]

---

**Built with ❤️ for the Shop community**

