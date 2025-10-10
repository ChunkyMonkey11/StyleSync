# 📝 Database Migration Guide

**Step 1: Users Table** - Creating the foundation

---

## 🎯 What This Migration Does

Creates a single `users` table with:
- ✅ Minimal schema (only essential fields)
- ✅ Indexes for fast queries
- ✅ Row Level Security (RLS) policies
- ✅ Auto-updating timestamps

**Size per user:** ~267 bytes (super efficient!)

---

## 🚀 How to Apply This Migration

### Option 1: Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy the entire contents of `clean-migration.sql`
5. Paste into the query editor
6. Click **"Run"**
7. You should see: ✅ Database migration completed successfully!

### Option 2: Supabase CLI (Command Line)

```bash
# Make sure you're in the project directory
cd /Users/revantpatel/StyleSync/shop-with-me

# Run the migration
supabase db execute --file ../docs/database/clean-migration.sql

# Or if you have the migration in a migrations folder:
supabase migration up
```

### Option 3: Direct PostgreSQL Connection

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the migration file
\i /Users/revantpatel/StyleSync/docs/database/clean-migration.sql
```

---

## ✅ Verify the Migration

After running, verify everything worked:

```sql
-- Check if users table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'users';

-- Check table structure
\d users

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'users';

-- Check RLS policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';
```

---

## 📊 What Was Created

### Table: `users`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| sync_id | UUID | NO | Primary key (auto-generated) |
| username | VARCHAR(20) | NO | Unique username |
| bio | VARCHAR(150) | YES | Optional bio |
| pfp_url | TEXT | YES | Profile picture URL |
| shop_user_id | TEXT | NO | Shop's user ID |
| created_at | TIMESTAMPTZ | NO | Creation timestamp |
| updated_at | TIMESTAMPTZ | NO | Last update timestamp |

### Indexes Created

1. **idx_users_username** (UNIQUE) - Fast username lookups for friend search
2. **idx_users_shop_user_id** - Fast Shop SDK integration queries
3. **idx_users_created_at** - Fast recent users queries

### RLS Policies

1. **anyone_can_view_profiles** - All users can see all profiles (for discovery)
2. **anyone_can_create_profile** - Anyone can register (onboarding)
3. **users_can_update_own_profile** - Users can only edit their own profile
4. **No DELETE policy** - Profiles can't be deleted by users (admin only)

### Triggers

1. **update_users_updated_at** - Automatically updates `updated_at` on any change

---

## 🧪 Test the Migration

Create a test user to verify everything works:

```sql
-- Insert a test user
INSERT INTO users (username, bio, shop_user_id, pfp_url)
VALUES (
    'testuser',
    'This is a test bio',
    'gid://shopify/Customer/123456789',
    'https://example.com/avatar.jpg'
)
RETURNING *;

-- Verify it was created
SELECT * FROM users WHERE username = 'testuser';

-- Update the user (trigger should update updated_at)
UPDATE users 
SET bio = 'Updated bio' 
WHERE username = 'testuser'
RETURNING *;

-- Check that updated_at changed
SELECT username, bio, created_at, updated_at 
FROM users 
WHERE username = 'testuser';

-- Clean up test data
DELETE FROM users WHERE username = 'testuser';
```

---

## 🔒 Security Notes

### Current Setup (Development-Friendly)
- ✅ Anyone can view profiles (needed for friend discovery)
- ✅ Anyone can create profiles (needed for registration)
- ✅ Users can only update their own profile

### For Production
You may want to add authentication checks:

```sql
-- Example: Require authentication for profile creation
DROP POLICY IF EXISTS "anyone_can_create_profile" ON users;

CREATE POLICY "authenticated_can_create_profile" 
    ON users 
    FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);
```

---

## 🐛 Troubleshooting

### Error: "extension uuid-ossp does not exist"
```sql
-- Run this first:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Error: "relation users already exists"
If you need to start over:
```sql
-- ⚠️ WARNING: This deletes all user data!
DROP TABLE IF EXISTS users CASCADE;

-- Then run the migration again
```

### Error: "permission denied"
Make sure you're connected as the postgres user or a user with SUPERUSER privileges.

---

## 📝 Next Steps

Once this migration is applied successfully:

1. ✅ **Build the edge function** - `/create-profile` endpoint
2. ✅ **Connect OnboardingForm** - Wire up form submission
3. ✅ **Test full flow** - User registration end-to-end
4. ✅ **Add more tables** - Connections, activity feed, etc. (future migrations)

---

## 📄 Migration File Location

```
/Users/revantpatel/StyleSync/docs/database/clean-migration.sql
```

---

## 💾 Backup Your Data

**Before running any migration on production:**

```bash
# Backup your database
pg_dump -h [HOST] -U postgres -d postgres > backup_$(date +%Y%m%d).sql
```

---

**Last Updated:** October 10, 2025  
**Status:** Ready to apply ✅

