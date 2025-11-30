-- Drop shops_catalog table (no longer needed after removing personalized recommendation engine)
-- This table was only used for popularity tracking which is no longer used

DROP TABLE IF EXISTS public.shops_catalog CASCADE;

-- Drop related indexes (should be automatically dropped with table, but just in case)
DROP INDEX IF EXISTS idx_shops_catalog_popularity;
DROP INDEX IF EXISTS idx_shops_catalog_follow_count;


