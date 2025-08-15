-- Script para verificar la estructura actual de las tablas files y folders
-- Ejecuta esto primero para ver qué columnas existen

-- 1. Verificar estructura actual de la tabla FILES
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'files' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar estructura actual de la tabla FOLDERS
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'folders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar qué columnas necesitamos según nuestro código TypeScript
-- Para FILES necesitamos:
-- - id (uuid)
-- - name (text) - puede ser que se llame 'filename' actualmente
-- - folder_id (uuid)
-- - storage_path (text)
-- - size (bigint)
-- - mimetype (text)
-- - created_at (timestamptz)
-- - user_id (uuid)
-- - is_shared (boolean)
-- - deleted_at (timestamptz, nullable)

-- Para FOLDERS necesitamos:
-- - id (uuid)
-- - name (text)
-- - parent_id (uuid, nullable)
-- - created_at (timestamptz)
-- - user_id (uuid)
-- - is_shared (boolean)
-- - deleted_at (timestamptz, nullable)
-- - original_parent_id (uuid, nullable)
