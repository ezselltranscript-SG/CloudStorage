-- Add missing columns to files table
-- This script adds the columns that are referenced in the TypeScript types but missing from the database

-- First, let's check if we need to rename filename to name
-- Only rename if filename column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'filename') THEN
        ALTER TABLE files RENAME COLUMN filename TO name;
    END IF;
END $$;

-- Add missing columns only if they don't exist
ALTER TABLE files ADD COLUMN IF NOT EXISTS mimetype TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS size BIGINT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add columns for folders (for trash functionality)
ALTER TABLE folders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS original_parent_id UUID REFERENCES folders(id);

-- Update existing files to have default values
UPDATE files SET 
  mimetype = 'application/octet-stream' 
WHERE mimetype IS NULL;

UPDATE files SET 
  size = 0 
WHERE size IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_files_deleted_at ON files(deleted_at);
CREATE INDEX IF NOT EXISTS idx_folders_deleted_at ON folders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_files_mimetype ON files(mimetype);
