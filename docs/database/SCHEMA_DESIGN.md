# 🗄️ Database Schema Design

**Date:** October 10, 2025  
**Status:** In Progress

---

## 📋 Design Philosophy

### Minimal Initial Collection
- Only store what we can't get from Shop SDK
- Query Shop SDK dynamically for behavioral data
- Let profiles build organically through usage

### Shop SDK as Source of Truth
- Recent browsing: Query `useRecentProducts()` when needed
- Saved products: Query `useSavedProducts()` when needed  
- Buyer attributes: Query `useBuyerAttributes()` when needed

---

## 🏗️ Database Tables

### **users** (Core Profile)

The absolute minimum to create a functional user account.

```sql
CREATE TABLE users (
  sync_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(20) UNIQUE NOT NULL,
  bio VARCHAR(150),
  pfp_url TEXT,
  shop_user_id TEXT NOT NULL, -- Shop's internal ID (from useCurrentUser)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE UNIQUE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_shop_user_id ON users(shop_user_id);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

#### Field Details

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `sync_id` | UUID | NO | Primary key, auto-generated |
| `username` | VARCHAR(20) | NO | Unique username for discovery |
| `bio` | VARCHAR(150) | YES | Optional user bio |
| `pfp_url` | TEXT | YES | Profile picture URL from Shop |
| `shop_user_id` | TEXT | NO | Shop's user ID (from SDK) |
| `created_at` | TIMESTAMPTZ | NO | Account creation time |
| `updated_at` | TIMESTAMPTZ | NO | Last profile update |

#### Data Collection Source

- **From user input:**
  - username
  - bio

- **From Shop SDK (`useCurrentUser()`):**
  - pfp_url (avatarImage.url)
  - shop_user_id (id)

- **Auto-generated:**
  - sync_id
  - created_at
  - updated_at

---

## 📝 OnboardingForm Data Flow

### What Form Collects

```typescript
interface OnboardingFormData {
  // User inputs
  username: string
  bio: string | null
  
  // From Shop SDK
  shop_user_id: string
  pfp_url: string | null
}
```

### Form Validation Rules

- **username:**
  - Required
  - 3-20 characters
  - Only lowercase letters, numbers, underscores
  - Unique (checked via API)

- **bio:**
  - Optional
  - Max 150 characters
  - Null if empty

### API Endpoint Flow

```
1. User submits form
2. Frontend validates username & bio
3. Frontend extracts shop_user_id & pfp_url from useCurrentUser()
4. POST to /create-profile edge function
5. Edge function:
   - Validates data
   - Checks username uniqueness
   - Inserts into users table
   - Returns sync_id
6. Frontend receives sync_id
7. User is now registered!
```

---

## 🚫 What We DON'T Store (Query Dynamically)

### Recent Products
```typescript
// Don't store in DB - query when needed
const { products: recentProducts } = useRecentProducts();
```

**Why not store:**
- Changes every time user browses Shop
- Stale within hours/days
- Shop SDK always has fresh data
- Expensive storage for ephemeral data

### Saved Products
```typescript
// Don't store in DB - query when needed
const { products: savedProducts } = useSavedProducts();
```

**Why not store:**
- User manages this in Shop, not our app
- Changes as they save/unsave
- Shop SDK has authoritative list

### Buyer Attributes
```typescript
// Don't store in DB - query when needed
const { buyerAttributes } = useBuyerAttributes();
```

**Why not store:**
- Most data belongs to Shop
- May contain sensitive info
- Changes over time
- Extract only what we need for algorithm (future)

---

## 🔮 Future Tables (Not Implemented Yet)

### **connections** (Friend Sync)
```sql
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(sync_id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(sync_id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_connection UNIQUE(user_id, friend_id),
  CONSTRAINT no_self_sync CHECK (user_id != friend_id)
);
```

### **user_showcase** (Curated Products)
```sql
CREATE TABLE user_showcase (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(sync_id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_snapshot JSONB, -- Store title, image, price for display
  display_order INT,
  pinned_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **activity_feed** (User Actions)
```sql
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(sync_id) ON DELETE CASCADE,
  activity_type VARCHAR(50), -- 'viewed_product', 'saved_product', 'posted'
  product_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔐 Row Level Security (RLS)

### Users Table Policies

```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (sync_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (sync_id = auth.uid());

-- Users can search for other users by username (public)
CREATE POLICY "Anyone can search usernames"
  ON users FOR SELECT
  USING (true);
```

---

## 📊 Data Size Estimates

### Per User (Minimal Approach)

```
users table entry:
- sync_id: 16 bytes (UUID)
- username: ~10 bytes avg
- bio: ~75 bytes avg
- pfp_url: ~100 bytes (URL)
- shop_user_id: ~50 bytes
- timestamps: 16 bytes
Total: ~267 bytes per user

For 10,000 users: ~2.5 MB
For 100,000 users: ~25 MB
For 1,000,000 users: ~250 MB

Very efficient! ✅
```

### If We Stored Everything (Comparison)

```
users + recent_products + saved_products:
- Base user: 267 bytes
- 20 recent products × 500 bytes: 10 KB
- 13 saved products × 500 bytes: 6.5 KB
Total: ~16.8 KB per user

For 10,000 users: ~168 MB
For 100,000 users: ~1.68 GB
For 1,000,000 users: ~16.8 GB

63x more expensive! ❌
```

---

## 🎯 Next Steps

1. ✅ Design users table schema
2. ⏳ Create migration file
3. ⏳ Update Supabase RLS policies
4. ⏳ Create /create-profile edge function
5. ⏳ Connect OnboardingForm to API
6. ⏳ Test full flow

---

## 💡 Key Insights

### Why This Approach Works

✅ **Cost-effective:** Only storing 267 bytes vs 16.8 KB per user  
✅ **Always fresh data:** Shop SDK provides current browsing/saves  
✅ **Faster onboarding:** Only collect username + optional bio  
✅ **Scalable:** Minimal storage footprint  
✅ **Shop as source of truth:** Respect their ecosystem  
✅ **Progressive profile:** Users build "island" through usage  

### When to Store Product Data

**DO store if:**
- User explicitly pins/showcases product
- Tracking engagement within YOUR app
- Creating historical timeline ("you loved this 3 months ago")

**DON'T store if:**
- Just displaying recent browsing
- Just showing saved items
- Data is available from Shop SDK

---

**Last Updated:** October 10, 2025  
**Next Review:** After implementing users table

