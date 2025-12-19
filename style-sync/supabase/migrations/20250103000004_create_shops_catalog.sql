-- Catalog of shops for popularity/co-follow analysis
CREATE TABLE IF NOT EXISTS public.shops_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id TEXT UNIQUE NOT NULL,
  shop_name TEXT,
  primary_domain TEXT,
  categories TEXT[],
  follow_count INTEGER DEFAULT 0,
  popularity_score NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shops_catalog_popularity ON public.shops_catalog(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_shops_catalog_follow_count ON public.shops_catalog(follow_count DESC);




