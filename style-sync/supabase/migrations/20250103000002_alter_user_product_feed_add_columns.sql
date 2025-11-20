-- Add columns to user_product_feed for personalization metadata
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_product_feed'
      AND column_name = 'source'
  ) THEN
    ALTER TABLE public.user_product_feed
      ADD COLUMN source TEXT DEFAULT 'shopify';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_product_feed'
      AND column_name = 'intent_name'
  ) THEN
    ALTER TABLE public.user_product_feed
      ADD COLUMN intent_name TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_product_feed'
      AND column_name = 'synced_at'
  ) THEN
    ALTER TABLE public.user_product_feed
      ADD COLUMN synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_product_feed'
      AND column_name = 'attributes'
  ) THEN
    ALTER TABLE public.user_product_feed
      ADD COLUMN attributes JSONB;
  END IF;
END $$;

-- Helpful composite index for filtering by source and recency
CREATE INDEX IF NOT EXISTS idx_user_product_feed_shop_source_created_at
  ON public.user_product_feed(shop_public_id, source, created_at DESC);

-- User-level personalization state (long-lived JSONB)
CREATE TABLE IF NOT EXISTS public.user_personalization_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_public_id TEXT NOT NULL,
  signals JSONB,               -- category frequencies, price bands per category, brand affinities, etc.
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (shop_public_id)
);

ALTER TABLE public.user_personalization_state
  ADD CONSTRAINT fk_user_personalization_state_userprofiles
  FOREIGN KEY (shop_public_id)
  REFERENCES public.userprofiles(shop_public_id)
  ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_user_personalization_state_shop_public_id
  ON public.user_personalization_state(shop_public_id);






