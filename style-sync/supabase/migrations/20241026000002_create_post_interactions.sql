-- Create post_interactions table for likes, upvotes, downvotes
-- Supports Reddit-style voting system

CREATE TABLE IF NOT EXISTS post_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    shop_public_id TEXT NOT NULL,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, shop_public_id, interaction_type)
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_post_interactions_post_id ON post_interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_shop_public_id ON post_interactions(shop_public_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_type ON post_interactions(interaction_type);

-- Add foreign key constraint to userprofiles table
ALTER TABLE post_interactions 
ADD CONSTRAINT fk_post_interactions_userprofiles 
FOREIGN KEY (shop_public_id) 
REFERENCES userprofiles(shop_public_id) 
ON DELETE CASCADE;

-- Add RLS (Row Level Security) policies
ALTER TABLE post_interactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all interactions on posts they can see
CREATE POLICY "Users can view interactions on visible posts" ON post_interactions
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

-- Policy: Users can create their own interactions
CREATE POLICY "Users can create their own interactions" ON post_interactions
    FOR INSERT WITH CHECK (
        shop_public_id = (
            SELECT shop_public_id 
            FROM userprofiles 
            WHERE shop_public_id = current_setting('request.jwt.claims', true)::json->>'publicId'
        )
    );

-- Policy: Users can update their own interactions
CREATE POLICY "Users can update their own interactions" ON post_interactions
    FOR UPDATE USING (
        shop_public_id = (
            SELECT shop_public_id 
            FROM userprofiles 
            WHERE shop_public_id = current_setting('request.jwt.claims', true)::json->>'publicId'
        )
    );

-- Policy: Users can delete their own interactions
CREATE POLICY "Users can delete their own interactions" ON post_interactions
    FOR DELETE USING (
        shop_public_id = (
            SELECT shop_public_id 
            FROM userprofiles 
            WHERE shop_public_id = current_setting('request.jwt.claims', true)::json->>'publicId'
        )
    );
