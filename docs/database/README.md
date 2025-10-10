# 🗄️ Database Documentation

Database schemas, migrations, architecture, and data models.

---

## 📄 Files in this folder

### **clean-migration.sql**
Database migration file for initial schema setup.

**Status:** Ready for schema definition

**👉 Update this file when:**
- Creating initial database schema
- Adding new tables
- Modifying table structures
- Creating indexes
- Setting up relationships

---

## 📋 Planned Tables

### Core Tables (Phase 1)
Based on `PROJECT_NOTES.md`, we'll need:

1. **users** - Core user profile data
   - syncId (UUID, primary key)
   - username (unique)
   - bio, pfp
   - timestamps

2. **user_metadata** - Shop SDK data
   - Interests array
   - Recent products
   - Saved products
   - Buyer attributes

3. **connections** - User sync relationships
   - Connection pairs
   - Status (pending, accepted)
   - Timestamps

4. **activity_feed** - User actions
   - Product views
   - Saves
   - Purchases (maybe)
   - Posts (Phase 2)

### Future Tables (Phase 2+)
- **posts** - User product posts
- **comments** - Post discussions
- **likes** - Post engagement
- **notifications** - User alerts

---

## 🏗️ Database Design Principles

### Data Modeling
- **Normalize when appropriate** - Reduce duplication
- **Denormalize for performance** - When read-heavy
- **Use UUIDs** - For all primary keys (syncId pattern)
- **Timestamp everything** - created_at, updated_at

### Indexes
- Username (for search)
- Connection lookups (both directions)
- Feed queries (user_id + timestamp)
- Activity queries (product_id, user_id)

### Relationships
- Users ↔ Connections (many-to-many through junction)
- Users → Activity (one-to-many)
- Users → Metadata (one-to-one)

---

## 📊 Data Storage Decisions

### Product Data
**Question to decide:** Store full product objects or just IDs?

**Option A: Store IDs only**
- Pros: Less storage, always fresh data
- Cons: Must query Shop API for display

**Option B: Store full objects**
- Pros: Fast retrieval, works offline
- Cons: Stale data, more storage

**Option C: Hybrid**
- Store: ID, title, image URL, price
- Query: Reviews, availability, fresh price

**👉 Decision needed before schema finalization**

### Metadata Storage
Shop SDK provides rich data. Consider:
- JSONB column for flexible metadata
- Separate tables for structured data
- Balance between flexibility and queryability

---

## 🔒 Security & Privacy

### Row Level Security (RLS)
Supabase RLS policies needed for:
- Users can read own profile
- Users can read synced friends' data
- Users can only update own profile
- Connection requests need both parties' approval

### Data Access Patterns
- **Public:** Username, pfp (for search/discovery)
- **Friends-only:** Feed, activity, purchases
- **Private:** Email, metadata, settings

---

## 🚀 Migration Strategy

### Initial Setup
1. Create core tables (users, connections, metadata)
2. Set up indexes
3. Configure RLS policies
4. Seed test data (optional)

### Version Control
- One migration file per schema change
- Name format: `YYYYMMDD_description.sql`
- Include rollback instructions
- Test migrations locally first

### Deployment
1. Test migration locally
2. Review with team
3. Apply to staging
4. Verify functionality
5. Apply to production

---

## 🛠️ Tools & Commands

### Supabase CLI

```bash
# Create new migration
supabase migration new migration_name

# Apply migrations locally
supabase db reset

# Apply migrations to remote
supabase db push

# Generate TypeScript types
supabase gen types typescript
```

### Useful Queries

```sql
-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check indexes
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'your_table';

-- Check RLS policies
SELECT * FROM pg_policies;
```

---

## 📝 Schema Documentation Template

When adding new tables, document:

```markdown
### Table: table_name

**Purpose:** Brief description

**Columns:**
- column_name (type, constraints) - description
- created_at (timestamptz) - record creation time
- updated_at (timestamptz) - last update time

**Indexes:**
- idx_name (columns) - purpose

**Relationships:**
- Foreign keys and references

**RLS Policies:**
- Policy name - description

**Notes:**
- Any special considerations
- Performance implications
- Data retention rules
```

---

## 🆕 Future Files to Add

- Schema diagrams (ERD)
- Data dictionary
- Query optimization guides
- Backup & recovery procedures
- Data retention policies
- Performance monitoring

---

## 💡 Next Steps

**Before writing schema:**
1. Review user profile structure in PROJECT_NOTES.md
2. Decide on product data storage approach
3. Map out relationship between tables
4. Design RLS policies
5. Plan indexes for query patterns

**When ready:**
1. Create/update clean-migration.sql
2. Test locally with sample data
3. Generate TypeScript types
4. Update application code to use new schema

---

Return to [Documentation Index](../README.md) | [Project Navigation](../../NAVIGATION.md)

