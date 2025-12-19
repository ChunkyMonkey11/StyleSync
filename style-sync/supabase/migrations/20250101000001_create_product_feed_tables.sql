-- Create user_product_feed table
-- Stores all products from various Shopify sources per user (saved, lists, orders, recent)

CREATE TABLE IF NOT EXISTS user_product_feed (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_public_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_title TEXT NOT NULL,
    product_image TEXT,
    product_url TEXT,
    product_price TEXT,
    product_currency TEXT,
    source_type TEXT NOT NULL CHECK (source_type IN ('saved', 'list', 'order', 'recent', 'recommended')),
    source_list_name TEXT,
    order_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: Deduplication is handled in application logic (sync-product-feed function)
-- since PostgreSQL doesn't support COALESCE in UNIQUE constraints directly

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_product_feed_shop_public_id ON user_product_feed(shop_public_id);
CREATE INDEX IF NOT EXISTS idx_user_product_feed_product_id ON user_product_feed(product_id);
CREATE INDEX IF NOT EXISTS idx_user_product_feed_created_at ON user_product_feed(created_at DESC);

-- Add foreign key constraint to userprofiles table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_user_product_feed_userprofiles'
    ) THEN
        ALTER TABLE user_product_feed 
        ADD CONSTRAINT fk_user_product_feed_userprofiles 
        FOREIGN KEY (shop_public_id) 
        REFERENCES userprofiles(shop_public_id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Create user_followed_shops table
-- Stores followed shops per user

CREATE TABLE IF NOT EXISTS user_followed_shops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_public_id TEXT NOT NULL,
    followed_shop_id TEXT NOT NULL,
    followed_shop_name TEXT NOT NULL,
    followed_shop_logo TEXT,
    followed_shop_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user doesn't follow the same shop twice
    UNIQUE(shop_public_id, followed_shop_id)
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_followed_shops_shop_public_id ON user_followed_shops(shop_public_id);
CREATE INDEX IF NOT EXISTS idx_user_followed_shops_followed_shop_id ON user_followed_shops(followed_shop_id);

-- Add foreign key constraint to userprofiles table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_user_followed_shops_userprofiles'
    ) THEN
        ALTER TABLE user_followed_shops 
        ADD CONSTRAINT fk_user_followed_shops_userprofiles 
        FOREIGN KEY (shop_public_id) 
        REFERENCES userprofiles(shop_public_id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Create trigger to automatically update updated_at timestamp for user_product_feed
DROP TRIGGER IF EXISTS update_user_product_feed_updated_at ON user_product_feed;
CREATE TRIGGER update_user_product_feed_updated_at 
    BEFORE UPDATE ON user_product_feed 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically update updated_at timestamp for user_followed_shops
DROP TRIGGER IF EXISTS update_user_followed_shops_updated_at ON user_followed_shops;
CREATE TRIGGER update_user_followed_shops_updated_at 
    BEFORE UPDATE ON user_followed_shops 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_product_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_followed_shops ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_product_feed
-- Users can view their own feed or feeds from their friends
DROP POLICY IF EXISTS "Users can view their own or friends' product feeds" ON user_product_feed;
CREATE POLICY "Users can view their own or friends' product feeds" ON user_product_feed
    FOR SELECT USING (
        shop_public_id = (
            SELECT shop_public_id 
            FROM userprofiles 
            WHERE shop_public_id = current_setting('request.jwt.claims', true)::json->>'publicId'
        )
        OR shop_public_id IN (
            SELECT DISTINCT 
                CASE 
                    WHEN fr.sender_id = up.id THEN up2.shop_public_id
                    ELSE up.shop_public_id
                END as friend_shop_public_id
            FROM friend_requests fr
            JOIN userprofiles up ON up.id = fr.sender_id
            JOIN userprofiles up2 ON up2.id = fr.receiver_id
            WHERE (up.shop_public_id = current_setting('request.jwt.claims', true)::json->>'publicId'
                   OR up2.shop_public_id = current_setting('request.jwt.claims', true)::json->>'publicId')
            AND fr.status = 'accepted'
        )
    );

-- Users can only insert/update/delete their own product feed
DROP POLICY IF EXISTS "Users can manage their own product feed" ON user_product_feed;
CREATE POLICY "Users can manage their own product feed" ON user_product_feed
    FOR ALL USING (
        shop_public_id = (
            SELECT shop_public_id 
            FROM userprofiles 
            WHERE shop_public_id = current_setting('request.jwt.claims', true)::json->>'publicId'
        )
    );

-- RLS Policies for user_followed_shops
-- Users can view their own followed shops or followed shops from their friends
DROP POLICY IF EXISTS "Users can view their own or friends' followed shops" ON user_followed_shops;
CREATE POLICY "Users can view their own or friends' followed shops" ON user_followed_shops
    FOR SELECT USING (
        shop_public_id = (
            SELECT shop_public_id 
            FROM userprofiles 
            WHERE shop_public_id = current_setting('request.jwt.claims', true)::json->>'publicId'
        )
        OR shop_public_id IN (
            SELECT DISTINCT 
                CASE 
                    WHEN fr.sender_id = up.id THEN up2.shop_public_id
                    ELSE up.shop_public_id
                END as friend_shop_public_id
            FROM friend_requests fr
            JOIN userprofiles up ON up.id = fr.sender_id
            JOIN userprofiles up2 ON up2.id = fr.receiver_id
            WHERE (up.shop_public_id = current_setting('request.jwt.claims', true)::json->>'publicId'
                   OR up2.shop_public_id = current_setting('request.jwt.claims', true)::json->>'publicId')
            AND fr.status = 'accepted'
        )
    );

-- Users can only insert/update/delete their own followed shops
DROP POLICY IF EXISTS "Users can manage their own followed shops" ON user_followed_shops;
CREATE POLICY "Users can manage their own followed shops" ON user_followed_shops
    FOR ALL USING (
        shop_public_id = (
            SELECT shop_public_id 
            FROM userprofiles 
            WHERE shop_public_id = current_setting('request.jwt.claims', true)::json->>'publicId'
        )
    );

