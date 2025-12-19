-- Create user_card_profile table for caching computed card data
-- Stores rank (2-A) and suit (spades/hearts/diamonds/clubs) based on friends count and interests

CREATE TABLE IF NOT EXISTS user_card_profile (
    user_id UUID NOT NULL PRIMARY KEY,
    shop_public_id TEXT NOT NULL,
    rank TEXT NOT NULL CHECK (rank IN ('2','3','4','5','6','7','8','9','10','J','Q','K','A')),
    suit TEXT NOT NULL CHECK (suit IN ('spades','hearts','diamonds','clubs')),
    friends_count INTEGER NOT NULL DEFAULT 0,
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Foreign key to userprofiles
    CONSTRAINT fk_user_card_profile_userprofiles 
        FOREIGN KEY (shop_public_id) 
        REFERENCES userprofiles(shop_public_id) 
        ON DELETE CASCADE
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_card_profile_shop_public_id ON user_card_profile(shop_public_id);
CREATE INDEX IF NOT EXISTS idx_user_card_profile_computed_at ON user_card_profile(computed_at);
CREATE INDEX IF NOT EXISTS idx_user_card_profile_rank ON user_card_profile(rank);
CREATE INDEX IF NOT EXISTS idx_user_card_profile_suit ON user_card_profile(suit);

-- Enable RLS
ALTER TABLE user_card_profile ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own card profile
CREATE POLICY "Users can view their own card profile" ON user_card_profile
    FOR SELECT USING (
        shop_public_id IN (
            SELECT shop_public_id FROM userprofiles WHERE shop_public_id = shop_public_id
        )
    );


