-- Create personalization_feedback table
-- Stores user interactions with personalized recommendations for learning

CREATE TABLE IF NOT EXISTS personalization_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_public_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'favorite', 'purchase', 'dismiss')),
    intent_name TEXT NOT NULL,
    product_id TEXT NOT NULL,
    session_id TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Add indexes for efficient querying
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_personalization_feedback_shop_public_id ON personalization_feedback(shop_public_id);
CREATE INDEX IF NOT EXISTS idx_personalization_feedback_intent_name ON personalization_feedback(intent_name);
CREATE INDEX IF NOT EXISTS idx_personalization_feedback_event_type ON personalization_feedback(event_type);
CREATE INDEX IF NOT EXISTS idx_personalization_feedback_timestamp ON personalization_feedback(timestamp DESC);

-- Add foreign key constraint to userprofiles table (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_personalization_feedback_userprofiles'
  ) THEN
    ALTER TABLE personalization_feedback
    ADD CONSTRAINT fk_personalization_feedback_userprofiles
    FOREIGN KEY (shop_public_id)
    REFERENCES userprofiles(shop_public_id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Create trigger to automatically update created_at timestamp (idempotent)
DROP TRIGGER IF EXISTS update_personalization_feedback_created_at ON personalization_feedback;
CREATE TRIGGER update_personalization_feedback_created_at
    BEFORE UPDATE ON personalization_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE personalization_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for personalization_feedback
-- Users can only manage their own feedback data
CREATE POLICY "Users can manage their own feedback" ON personalization_feedback
    FOR ALL USING (
        shop_public_id = (
            SELECT shop_public_id
            FROM userprofiles
            WHERE shop_public_id = current_setting('request.jwt.claims', true)::json->>'publicId'
        )
    );

-- Create user_search_intents table for storing intent success rates
CREATE TABLE IF NOT EXISTS user_search_intents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_public_id TEXT NOT NULL,
    intent_name TEXT NOT NULL,
    query_text TEXT,
    filters JSONB,
    sort_by TEXT,
    success_rate DECIMAL DEFAULT 0,
    total_events INTEGER DEFAULT 0,
    positive_events INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(shop_public_id, intent_name)
);

-- Add indexes for user_search_intents
CREATE INDEX IF NOT EXISTS idx_user_search_intents_shop_public_id ON user_search_intents(shop_public_id);
CREATE INDEX IF NOT EXISTS idx_user_search_intents_success_rate ON user_search_intents(success_rate DESC);

-- Add foreign key constraint (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_search_intents_userprofiles'
  ) THEN
    ALTER TABLE user_search_intents
    ADD CONSTRAINT fk_user_search_intents_userprofiles
    FOREIGN KEY (shop_public_id)
    REFERENCES userprofiles(shop_public_id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Create trigger for updated_at (idempotent)
DROP TRIGGER IF EXISTS update_user_search_intents_updated_at ON user_search_intents;
CREATE TRIGGER update_user_search_intents_updated_at
    BEFORE UPDATE ON user_search_intents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for user_search_intents
ALTER TABLE user_search_intents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_search_intents
CREATE POLICY "Users can manage their own search intents" ON user_search_intents
    FOR ALL USING (
        shop_public_id = (
            SELECT shop_public_id
            FROM userprofiles
            WHERE shop_public_id = current_setting('request.jwt.claims', true)::json->>'publicId'
        )
    );


