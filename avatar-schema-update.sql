-- Add avatar-related columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_avatar_skipped BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_image_url TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_avatar_skipped ON users(is_avatar_skipped);
CREATE INDEX IF NOT EXISTS idx_users_avatar_url ON users(avatar_image_url); 