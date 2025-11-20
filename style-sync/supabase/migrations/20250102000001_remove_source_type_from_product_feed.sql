-- Remove source_type, source_list_name, and order_id columns from user_product_feed
-- These are no longer needed - we're just storing all products in one unified feed

-- Drop the index on source_type first
DROP INDEX IF EXISTS idx_user_product_feed_source_type;

-- Remove the columns
ALTER TABLE user_product_feed 
DROP COLUMN IF EXISTS source_type,
DROP COLUMN IF EXISTS source_list_name,
DROP COLUMN IF EXISTS order_id;

-- Add unique constraint to prevent duplicate products per user
-- This ensures each product_id appears only once per shop_public_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'unique_user_product'
  ) THEN
    ALTER TABLE user_product_feed
    ADD CONSTRAINT unique_user_product UNIQUE (shop_public_id, product_id);
  END IF;
END $$;

