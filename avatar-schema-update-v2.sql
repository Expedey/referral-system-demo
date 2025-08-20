-- Update avatar-related columns in users table
-- Remove is_avatar_skipped column
ALTER TABLE users DROP COLUMN IF EXISTS is_avatar_skipped;

-- Add loggedInBefore column
ALTER TABLE users ADD COLUMN IF NOT EXISTS loggedInBefore BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_logged_in_before ON users(loggedInBefore);
CREATE INDEX IF NOT EXISTS idx_users_avatar_url ON users(avatar_image_url);

-- Remove old index if it exists
DROP INDEX IF EXISTS idx_users_avatar_skipped; 