# StyleSync

A social shopping experience built as a Shopify Shop Mini, where users can discover style through their friends' product feeds and build their own personalized fashion community.

## Overview

StyleSync is a mobile-only React application that runs exclusively within the Shopify Shop App's WebView. Users can create profiles, connect with friends, and discover products through a social feed system. The app features a unique card-based ranking system that gamifies the social shopping experience.

## Features

- **User Profiles**: Create and customize your profile with interests and style preferences
- **Friend System**: Send and accept friend requests, manage your social network
- **Product Feeds**: Discover products from friends' shopping activity
- **Card Ranking System**: Earn cards based on your social activity (friends count, engagement)
- **Deck Guide**: Learn about the card ranking tiers and your current status
- **Personalized Recommendations**: Get product recommendations based on your preferences

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **Vite** - Build tool
- **@shopify/shop-minis-react** (v0.2.0) - Shopify Shop Minis SDK

### Backend
- **Deno Edge Functions** - Serverless API endpoints
- **Supabase** - Backend-as-a-Service (PostgreSQL database)
- **JWT Authentication** - Secure token-based auth
- **Shopify Minis Admin API** - User verification and authentication

## Project Structure

```
style-sync/
├── src/
│   ├── components/          # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components (routes)
│   │   ├── auth/           # Authentication pages
│   │   ├── deck/           # Deck guide page
│   │   ├── feeds/           # Feed pages
│   │   ├── social/          # Friends management
│   │   └── user_profile/    # Profile pages
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions and API clients
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── manifest.json        # Shop Mini configuration
├── supabase/
│   ├── functions/          # Deno Edge Functions
│   │   ├── _shared/        # Shared utilities
│   │   └── [function-name]/ # Individual functions
│   └── migrations/         # Database migrations
└── package.json
```

## Prerequisites

- **Node.js** 18+ and npm
- **Supabase CLI** - For local development and deployment
- **Shopify Shop Minis CLI** - For Shop Mini development
- **Shopify Partner Account** - For Shop Minis Admin API access

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

#### Local Development

```bash
# Start local Supabase instance
npx supabase start

# This will output:
# - API URL: http://127.0.0.1:54321
# - DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

#### Production Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Link your local project:
   ```bash
   npx supabase link --project-ref your-project-ref
   ```

### 3. Environment Variables

#### Supabase Edge Functions

Set these secrets in your Supabase project (Dashboard → Settings → Edge Functions → Secrets):

```bash
# Required for auth function
JWT_SECRET_KEY=your-secret-key-here
SHOP_MINIS_ADMIN_API_KEY=your-shop-minis-admin-api-key

# Auto-configured (usually don't need to set manually)
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Getting your Shop Minis Admin API Key:**
1. Go to your Shopify Partner Dashboard
2. Navigate to your Shop Mini app
3. Find the Admin API key in the app settings

#### Local Development

For local Supabase development, create `.env.local` in the `supabase/` directory:

```bash
JWT_SECRET_KEY=your-local-secret-key
SHOP_MINIS_ADMIN_API_KEY=your-admin-api-key
```

### 4. Database Migrations

Apply database migrations:

```bash
# Local development
npx supabase db reset

# Production
npx supabase db push
```

### 5. Deploy Edge Functions

```bash
# Deploy all functions
npx supabase functions deploy

# Or deploy individually
npx supabase functions deploy auth
npx supabase functions deploy check-profile
# ... etc
```

### 6. Configure Shop Mini Manifest

Update `src/manifest.json` with your configuration:

```json
{
  "name": "StyleSync",
  "handle": "your-handle",
  "privacy_policy_url": "https://yourdomain.com/privacy",
  "terms_url": "https://yourdomain.com/terms",
  "trusted_domains": ["your-supabase-project.supabase.co"]
}
```

## Development

### Start Development Server

```bash
npm start
# or
npx shop-minis dev
```

When the dev server is running:
- Press `i` - Open in iOS Simulator
- Press `a` - Open in Android Emulator
- Press `q` - Show QR code for physical device testing

**Important**: Always test on actual mobile simulators/devices, not just browser DevTools.

### Linting

```bash
npm run lint
npm run lint:fix
```

### Type Checking

TypeScript strict mode is enabled. Check for errors:

```bash
npx tsc --noEmit
```

## Deployment

### Supabase Functions

Deploy all functions:

```bash
npx supabase functions deploy
```

Or deploy individually:

```bash
npx supabase functions deploy [function-name]
```

### Shop Mini Submission

1. Build and validate your mini:
   ```bash
   npx shop-minis validate-manifest
   ```

2. Submit for review:
   ```bash
   npx shop-minis submit
   ```

3. Check submission status:
   ```bash
   npx shop-minis check-submission
   ```

## API Endpoints

All API endpoints are Deno Edge Functions deployed to Supabase:

- `auth` - Authenticate user and get JWT token
- `check-profile` - Check if user profile exists
- `create-profile` - Create or update user profile
- `get-card-profile` - Get user's card ranking profile
- `get-friends` - Get user's friends list
- `get-friend-requests` - Get pending friend requests
- `send-friend-request` - Send a friend request
- `respond-friend-request` - Accept/decline friend request
- `remove-friend` - Remove a friend
- `get-friends-cards` - Get friends' card profiles
- `get-friend-feed` - Get a friend's product feed
- `get-public-profiles` - Search public profiles
- `sync-product-feed` - Sync user's product feed from Shopify
- `get-following` - Get users you follow
- `get-followers` - Get users following you

## Database Schema

The database schema is managed through Supabase migrations in `supabase/migrations/`. Key tables:

- `userprofiles` - User profile information
- `friend_requests` - Friend request relationships
- `user_product_feed` - User's product feed items
- `user_card_profile` - Card ranking system data

See migration files for complete schema definitions.

## Code Style

This project follows the guidelines in `STYLE_GUIDE.md`. Key principles:

- **SDK-First**: Always use `@shopify/shop-minis-react` components when available
- **Mobile-Only**: Optimize exclusively for touch interfaces
- **TypeScript Strict**: All code must pass strict type checking
- **Tailwind CSS**: Use Tailwind classes for all styling

## Troubleshooting

### White Screen on Load

Ensure your `manifest.json` is valid:
- Remove invalid scopes (`email`, `offline_access` don't exist)
- Remove `https://` prefix from `trusted_domains`
- Run `npx shop-minis validate-manifest`

### Edge Function Errors

Check function logs:
```bash
npx supabase functions logs [function-name]
```

### Database Connection Issues

Verify your Supabase project is linked:
```bash
npx supabase status
```

## Contributing

1. Follow the code style guidelines in `STYLE_GUIDE.md`
2. Ensure all TypeScript checks pass
3. Test on mobile simulators/devices
4. Update documentation as needed

## License

[Add your license here]

## Support

For issues and questions:
- Check `STYLE_GUIDE.md` for development guidelines
- Review Supabase function logs for backend issues
- Validate manifest with `npx shop-minis validate-manifest`

---

**Built with ❤️ for the Shopify Shop Minis platform**

