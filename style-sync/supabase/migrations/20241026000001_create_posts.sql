-- Create posts table for StyleSync feed system
-- Supports both style updates and product recommendations

CREATE TABLE IF NOT EXISTS posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    shop_public_id TEXT NOT NULL,
    post_type TEXT NOT NULL CHECK (post_type IN ('style', 'product')),
    content TEXT NOT NULL,
    product_url TEXT,
    product_image TEXT,
    product_title TEXT,
    product_price TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_posts_shop_public_id ON posts(shop_public_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);

-- Add foreign key constraint to userprofiles table
ALTER TABLE posts 
ADD CONSTRAINT fk_posts_userprofiles 
FOREIGN KEY (shop_public_id) 
REFERENCES userprofiles(shop_public_id) 
ON DELETE CASCADE;

-- Add RLS (Row Level Security) policies
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view posts from their friends
CREATE POLICY "Users can view posts from friends" ON posts
    FOR SELECT USING (
        shop_public_id IN (
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
        OR shop_public_id = (
            SELECT shop_public_id 
            FROM userprofiles 
            WHERE shop_public_id = current_setting('request.jwt.claims', true)::json->>'publicId'
        )
    );

-- Policy: Users can create their own posts
CREATE POLICY "Users can create their own posts" ON posts
    FOR INSERT WITH CHECK (
        shop_public_id = (
            SELECT shop_public_id 
            FROM userprofiles 
            WHERE shop_public_id = current_setting('request.jwt.claims', true)::json->>'publicId'
        )
    );

-- Policy: Users can update their own posts
CREATE POLICY "Users can update their own posts" ON posts
    FOR UPDATE USING (
        shop_public_id = (
            SELECT shop_public_id 
            FROM userprofiles 
            WHERE shop_public_id = current_setting('request.jwt.claims', true)::json->>'publicId'
        )
    );

-- Policy: Users can delete their own posts
CREATE POLICY "Users can delete their own posts" ON posts
    FOR DELETE USING (
        shop_public_id = (
            SELECT shop_public_id 
            FROM userprofiles 
            WHERE shop_public_id = current_setting('request.jwt.claims', true)::json->>'publicId'
        )
    );
