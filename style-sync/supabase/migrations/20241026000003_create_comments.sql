-- Create comments table for threaded comments on posts
-- Supports Reddit-style nested comments

CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    shop_public_id TEXT NOT NULL,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_shop_public_id ON comments(shop_public_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Add foreign key constraint to userprofiles table
ALTER TABLE comments 
ADD CONSTRAINT fk_comments_userprofiles 
FOREIGN KEY (shop_public_id) 
REFERENCES userprofiles(shop_public_id) 
ON DELETE CASCADE;

-- Add RLS (Row Level Security) policies
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view comments on posts they can see
CREATE POLICY "Users can view comments on visible posts" ON comments
    FOR SELECT USING (
        post_id IN (
            SELECT p.id FROM posts p
            WHERE p.shop_public_id IN (
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
            OR p.shop_public_id = (
                SELECT shop_public_id 
                FROM userprofiles 
                WHERE shop_public_id = current_setting('request.jwt.claims', true)::json->>'publicId'
            )
        )
    );

-- Policy: Users can create their own comments
CREATE POLICY "Users can create their own comments" ON comments
    FOR INSERT WITH CHECK (
        shop_public_id = (
            SELECT shop_public_id 
            FROM userprofiles 
            WHERE shop_public_id = current_setting('request.jwt.claims', true)::json->>'publicId'
        )
    );

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE USING (
        shop_public_id = (
            SELECT shop_public_id 
            FROM userprofiles 
            WHERE shop_public_id = current_setting('request.jwt.claims', true)::json->>'publicId'
        )
    );

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON comments
    FOR DELETE USING (
        shop_public_id = (
            SELECT shop_public_id 
            FROM userprofiles 
            WHERE shop_public_id = current_setting('request.jwt.claims', true)::json->>'publicId'
        )
    );
