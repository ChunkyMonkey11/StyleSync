-- Remove personalized recommendation engine tables and columns
-- This migration removes all personalization-related database objects

-- ============================================
-- STEP 1: DROP PERSONALIZATION TABLES
-- ============================================

-- Drop user_search_intents table (if exists)
DROP TABLE IF EXISTS public.user_search_intents CASCADE;

-- Drop personalization_feedback table (if exists)
DROP TABLE IF EXISTS public.personalization_feedback CASCADE;

-- Drop user_personalization_state table (if exists)
DROP TABLE IF EXISTS public.user_personalization_state CASCADE;

-- ============================================
-- STEP 2: REMOVE intent_name COLUMN FROM user_product_feed
-- ============================================
-- Note: We keep the source and attributes columns as they're still used for feed tracking

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_product_feed'
      AND column_name = 'intent_name'
  ) THEN
    ALTER TABLE public.user_product_feed
    DROP COLUMN intent_name;
    
    RAISE NOTICE 'Dropped intent_name column from user_product_feed';
  ELSE
    RAISE NOTICE 'intent_name column does not exist in user_product_feed';
  END IF;
END $$;

-- ============================================
-- STEP 3: CLEAN UP ANY REMAINING INDEXES
-- ============================================
-- These should be automatically dropped with the tables, but just in case:

DROP INDEX IF EXISTS idx_personalization_feedback_shop_public_id;
DROP INDEX IF EXISTS idx_personalization_feedback_intent_name;
DROP INDEX IF EXISTS idx_personalization_feedback_event_type;
DROP INDEX IF EXISTS idx_personalization_feedback_timestamp;
DROP INDEX IF EXISTS idx_user_search_intents_shop_public_id;
DROP INDEX IF EXISTS idx_user_search_intents_success_rate;
DROP INDEX IF EXISTS idx_user_personalization_state_shop_public_id;

