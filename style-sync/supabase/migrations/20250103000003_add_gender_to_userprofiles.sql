-- Add gender column to userprofiles (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'userprofiles' AND column_name = 'gender'
  ) THEN
    ALTER TABLE public.userprofiles
      ADD COLUMN gender TEXT
      CHECK (gender IN ('MALE','FEMALE','NEUTRAL'));
  END IF;
END $$;




