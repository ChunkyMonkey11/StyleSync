-- Add is_public column to userprofiles table
ALTER TABLE userprofiles 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Set existing profiles to public by default
UPDATE userprofiles SET is_public = true WHERE is_public IS NULL;

-- Add index for efficient querying of public profiles
CREATE INDEX IF NOT EXISTS idx_userprofiles_is_public ON userprofiles(is_public) WHERE is_public = true;


