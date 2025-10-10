-- StyleSync Clean Database Migration Script
-- This script performs a clean migration by dropping old tables and creating new ones

-- Start transaction
BEGIN;

-- Drop existing tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS story_notifications CASCADE;
DROP TABLE IF EXISTS user_category_affinities CASCADE;
DROP TABLE IF EXISTS user_shop_interactions CASCADE;
DROP TABLE IF EXISTS user_feed_items CASCADE;
DROP TABLE IF EXISTS item_votes CASCADE;
DROP TABLE IF EXISTS shared_items CASCADE;
DROP TABLE IF EXISTS follow_requests CASCADE;
DROP TABLE IF EXISTS followers CASCADE;
DROP TABLE IF EXISTS shopify_tokens CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop any existing functions
DROP FUNCTION IF EXISTS update_last_active() CASCADE;
DROP FUNCTION IF EXISTS get_user_stats(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_feed(TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_friends_feed(TEXT, INTEGER) CASCADE;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE user_profiles (
    user_id TEXT PRIMARY KEY,                    -- Shopify Public ID (gid://shopify/Customer/...)
    username TEXT UNIQUE NOT NULL,               -- Custom username (e.g., @johndoe)
    display_name TEXT NOT NULL,                  -- Display name from Shopify
    profile_pic TEXT,                           -- Profile picture URL
    bio TEXT,                                   -- User bio/description
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    username_selected_at TIMESTAMP WITH TIME ZONE,
    shopify_customer_data JSONB                 -- Store additional Shopify data
);

-- Create followers table
CREATE TABLE followers (
    id SERIAL PRIMARY KEY,
    follower_id TEXT REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    following_id TEXT REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Create follow_requests table
CREATE TABLE follow_requests (
    id SERIAL PRIMARY KEY,
    requester_id TEXT REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    target_id TEXT REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(requester_id, target_id)
);

-- Create shared_items table
CREATE TABLE shared_items (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,                   -- Shopify product ID
    product_data JSONB NOT NULL,               -- Product information
    share_message TEXT,                        -- Optional message
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create item_votes table
CREATE TABLE item_votes (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES shared_items(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL,                   -- 'like', 'dislike'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(item_id, user_id)
);

-- Create user_feed_items table
CREATE TABLE user_feed_items (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_data JSONB NOT NULL,
    activity_type TEXT NOT NULL,               -- 'saved', 'shared', 'viewed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_shop_interactions table
CREATE TABLE user_shop_interactions (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    interaction_type TEXT NOT NULL,            -- 'view', 'save', 'share', 'purchase'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_category_affinities table
CREATE TABLE user_category_affinities (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    affinity_score DECIMAL(3,2) DEFAULT 0.0,  -- 0.0 to 1.0
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category)
);

-- Create story_notifications table
CREATE TABLE story_notifications (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    actor_id TEXT REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,           -- 'follow', 'like', 'share'
    story_id INTEGER,                         -- Reference to story/activity
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shopify_tokens table
CREATE TABLE shopify_tokens (
    id SERIAL PRIMARY KEY,
    public_id TEXT UNIQUE NOT NULL,           -- Shopify Public ID
    access_token TEXT NOT NULL,               -- Encrypted access token
    refresh_token TEXT,                       -- Encrypted refresh token
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX idx_followers_follower_id ON followers(follower_id);
CREATE INDEX idx_followers_following_id ON followers(following_id);
CREATE INDEX idx_follow_requests_requester_id ON follow_requests(requester_id);
CREATE INDEX idx_follow_requests_target_id ON follow_requests(target_id);
CREATE INDEX idx_shared_items_user_id ON shared_items(user_id);
CREATE INDEX idx_shared_items_created_at ON shared_items(created_at);
CREATE INDEX idx_item_votes_item_id ON item_votes(item_id);
CREATE INDEX idx_item_votes_user_id ON item_votes(user_id);
CREATE INDEX idx_user_feed_items_user_id_created ON user_feed_items(user_id, created_at DESC);
CREATE INDEX idx_user_shop_interactions_user_id ON user_shop_interactions(user_id);
CREATE INDEX idx_user_category_affinities_user_id ON user_category_affinities(user_id);
CREATE INDEX idx_story_notifications_user_id ON story_notifications(user_id);
CREATE INDEX idx_story_notifications_actor_id ON story_notifications(actor_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_shop_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_category_affinities ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view all profiles" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (true);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (true);

-- Create RLS policies for followers
CREATE POLICY "Users can view all followers" ON followers
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own follows" ON followers
    FOR ALL USING (follower_id = current_setting('app.current_user_id'));

-- Create RLS policies for follow_requests
CREATE POLICY "Users can view own follow requests" ON follow_requests
    FOR SELECT USING (requester_id = current_setting('app.current_user_id') OR target_id = current_setting('app.current_user_id'));

CREATE POLICY "Users can create follow requests" ON follow_requests
    FOR INSERT WITH CHECK (requester_id = current_setting('app.current_user_id'));

CREATE POLICY "Users can update own follow requests" ON follow_requests
    FOR UPDATE USING (target_id = current_setting('app.current_user_id'));

-- Create RLS policies for shared_items
CREATE POLICY "Users can view all shared items" ON shared_items
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own shared items" ON shared_items
    FOR ALL USING (user_id = current_setting('app.current_user_id'));

-- Create RLS policies for item_votes
CREATE POLICY "Users can view all votes" ON item_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own votes" ON item_votes
    FOR ALL USING (user_id = current_setting('app.current_user_id'));

-- Create RLS policies for user_feed_items
CREATE POLICY "Users can view own feed" ON user_feed_items
    FOR SELECT USING (user_id = current_setting('app.current_user_id'));

CREATE POLICY "Users can manage own feed" ON user_feed_items
    FOR ALL USING (user_id = current_setting('app.current_user_id'));

-- Create RLS policies for user_shop_interactions
CREATE POLICY "Users can view own interactions" ON user_shop_interactions
    FOR SELECT USING (user_id = current_setting('app.current_user_id'));

CREATE POLICY "Users can manage own interactions" ON user_shop_interactions
    FOR ALL USING (user_id = current_setting('app.current_user_id'));

-- Create RLS policies for user_category_affinities
CREATE POLICY "Users can view own affinities" ON user_category_affinities
    FOR SELECT USING (user_id = current_setting('app.current_user_id'));

CREATE POLICY "Users can manage own affinities" ON user_category_affinities
    FOR ALL USING (user_id = current_setting('app.current_user_id'));

-- Create RLS policies for story_notifications
CREATE POLICY "Users can view own notifications" ON story_notifications
    FOR SELECT USING (user_id = current_setting('app.current_user_id'));

CREATE POLICY "Users can manage own notifications" ON story_notifications
    FOR ALL USING (user_id = current_setting('app.current_user_id'));

-- Create RLS policies for shopify_tokens
CREATE POLICY "Users can view own tokens" ON shopify_tokens
    FOR SELECT USING (public_id = current_setting('app.current_user_id'));

CREATE POLICY "Users can manage own tokens" ON shopify_tokens
    FOR ALL USING (public_id = current_setting('app.current_user_id'));

-- Create functions for common operations
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_active = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_active
CREATE TRIGGER update_user_profiles_last_active
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_last_active();

-- Create function to get user stats
CREATE OR REPLACE FUNCTION get_user_stats(user_id_param TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'followers_count', (SELECT COUNT(*) FROM followers WHERE following_id = user_id_param),
        'following_count', (SELECT COUNT(*) FROM followers WHERE follower_id = user_id_param),
        'shared_items_count', (SELECT COUNT(*) FROM shared_items WHERE user_id = user_id_param),
        'total_likes', (SELECT COUNT(*) FROM item_votes iv JOIN shared_items si ON iv.item_id = si.id WHERE si.user_id = user_id_param AND iv.vote_type = 'like')
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user feed
CREATE OR REPLACE FUNCTION get_user_feed(user_id_param TEXT, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    id INTEGER,
    user_id TEXT,
    product_id TEXT,
    product_data JSONB,
    activity_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT ufi.id, ufi.user_id, ufi.product_id, ufi.product_data, ufi.activity_type, ufi.created_at
    FROM user_feed_items ufi
    WHERE ufi.user_id = user_id_param
    ORDER BY ufi.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get friends feed
CREATE OR REPLACE FUNCTION get_friends_feed(user_id_param TEXT, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    id INTEGER,
    user_id TEXT,
    product_id TEXT,
    product_data JSONB,
    activity_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    username TEXT,
    display_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT ufi.id, ufi.user_id, ufi.product_id, ufi.product_data, ufi.activity_type, ufi.created_at, up.username, up.display_name
    FROM user_feed_items ufi
    JOIN user_profiles up ON ufi.user_id = up.user_id
    WHERE ufi.user_id IN (
        SELECT following_id FROM followers WHERE follower_id = user_id_param
    )
    ORDER BY ufi.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Commit the transaction
COMMIT;

-- Insert sample data for testing (optional - remove in production)
-- INSERT INTO user_profiles (user_id, username, display_name, bio) VALUES
-- ('gid://shopify/Customer/123456789', 'testuser', 'Test User', 'This is a test user');

-- Success message
SELECT 'Database migration completed successfully!' as status;
