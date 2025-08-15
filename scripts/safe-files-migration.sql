-- SAFE migration script for FILES table
-- Based on current structure analysis, only ONE column is missing

-- Your current files table has:
-- ✅ id, name, size, folder_id, storage_path, user_id, deleted_at, created_at, is_shared
-- ❌ Missing: mimetype (you have 'type' but code expects 'mimetype')

-- OPTION 1: Add mimetype column and copy data from 'type' column
ALTER TABLE files ADD COLUMN IF NOT EXISTS mimetype TEXT;

-- Copy existing data from 'type' to 'mimetype'
UPDATE files SET mimetype = type WHERE mimetype IS NULL AND type IS NOT NULL;

-- Set default for records without type
UPDATE files SET mimetype = 'application/octet-stream' WHERE mimetype IS NULL;

-- OPTION 2: Alternative - rename 'type' to 'mimetype' (uncomment if preferred)
-- ALTER TABLE files RENAME COLUMN type TO mimetype;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_files_mimetype ON files(mimetype);
