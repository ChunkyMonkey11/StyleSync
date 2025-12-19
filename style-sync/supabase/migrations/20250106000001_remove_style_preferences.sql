-- Remove style_preferences column from userprofiles table
-- This column is being removed as we're only keeping user interests going forward
-- (idempotent - safe to run multiple times)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'userprofiles' 
    AND column_name = 'style_preferences'
  ) THEN
    ALTER TABLE public.userprofiles
      DROP COLUMN style_preferences;
    
    RAISE NOTICE 'Dropped style_preferences column from userprofiles table';
  ELSE
    RAISE NOTICE 'style_preferences column does not exist in userprofiles table (already removed)';
  END IF;
END $$;

