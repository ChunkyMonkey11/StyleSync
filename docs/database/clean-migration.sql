-- ============================================================================
-- StyleSync Database Migration - Step 1: Users Table
-- ============================================================================
-- 
-- Purpose: Create the foundational users table for StyleSync
-- Date: October 10, 2025
-- 
-- This migration creates ONLY the users table with minimal required fields.
-- Future tables (connections, activity_feed, etc.) will be added in separate
-- migrations as we build out features.
--
-- ============================================================================

-- Start transaction for atomic execution
BEGIN;

-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: users
-- ============================================================================
-- 
-- The core user profile table. Stores minimal information collected during
-- onboarding. Behavioral data (browsing, saves) is queried dynamically from
-- Shop SDK, not stored here.
--
-- Design Philosophy:
-- - Only store what we can't get from Shop SDK
-- - Keep it minimal (~267 bytes per user)
-- - Query Shop SDK for recent/saved products dynamically
--
CREATE TABLE user_profiles (
    -- Primary key: auto-generated UUID for internal tracking
    sync_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User-provided data (from onboarding form)
    username VARCHAR(20) UNIQUE NOT NULL,
    bio VARCHAR(150),
    
    -- Shop SDK data (from useCurrentUser hook)
    pfp_url TEXT,
    shop_user_id TEXT NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES: For query performance
-- ============================================================================

-- Username lookups (for friend search)
CREATE UNIQUE INDEX idx_user_profiles_username ON user_profiles(username);

-- Shop user ID lookups (for Shop SDK integration)
CREATE INDEX idx_user_profiles_shop_user_id ON user_profiles(shop_user_id);

-- Recent users query (for admin/analytics)
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS): Security policies
-- ============================================================================

-- Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view all user profiles (needed for friend discovery)
CREATE POLICY "anyone_can_view_profiles" 
    ON user_profiles 
    FOR SELECT 
    USING (true);

-- Policy: Anyone can insert a new profile (for registration)
-- Note: In production, you may want to add authentication checks here
CREATE POLICY "anyone_can_create_profile" 
    ON user_profiles 
    FOR INSERT 
    WITH CHECK (true);

-- Policy: Users can only update their own profile
-- Note: This requires setting app.current_user_id in your session
-- Example: SET LOCAL app.current_user_id = 'user-uuid';
CREATE POLICY "users_can_update_own_profile" 
    ON user_profiles 
    FOR UPDATE 
    USING (sync_id::text = current_setting('app.current_user_id', true));

-- Policy: Users cannot delete profiles (only admins should)
-- Note: No DELETE policy = no one can delete via normal queries

-- ============================================================================
-- TRIGGERS: Automated behaviors
-- ============================================================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at on every UPDATE
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMIT & SUCCESS MESSAGE
-- ============================================================================

COMMIT;

SELECT '✅ Database migration completed successfully!' as status,
       'user_profiles table created with minimal schema' as details;
