-- Rename loggedInBefore column to logged_in_before (snake_case)
ALTER TABLE users RENAME COLUMN "loggedInBefore" TO logged_in_before;

-- Update index name to match new column name
DROP INDEX IF EXISTS idx_users_logged_in_before;
CREATE INDEX IF NOT EXISTS idx_users_logged_in_before ON users(logged_in_before); 