-- Script para corregir problemas específicos con las consultas del panel de administración

-- 1. Verificar la estructura de la tabla files
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'files' 
AND table_schema = 'public';

-- 2. Verificar la estructura de la tabla users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public';

-- 3. Verificar la estructura de la tabla user_roles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
AND table_schema = 'public';

-- 4. Verificar las políticas RLS existentes
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('files', 'users', 'user_roles', 'organization_settings');

-- 5. Corregir la tabla user_roles si es necesario
DO $$
DECLARE
    role_id_exists BOOLEAN;
BEGIN
    -- Verificar si existe la columna role_id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_roles' 
        AND column_name = 'role_id' 
        AND table_schema = 'public'
    ) INTO role_id_exists;
    
    -- Si existe role_id pero no role, crear una vista o actualizar la tabla
    IF role_id_exists THEN
        -- Crear una vista compatible con las consultas que esperan user_id y role
        EXECUTE 'CREATE OR REPLACE VIEW user_roles_view AS 
                SELECT user_id, role_id as role 
                FROM user_roles';
                
        -- Actualizar las políticas RLS para la vista
        EXECUTE 'CREATE POLICY "Anyone can view user_roles_view" ON user_roles_view 
                FOR SELECT TO authenticated 
                USING (true)';
    END IF;
END
$$;

-- 6. Corregir la tabla files para permitir el join con users
DO $$
BEGIN
    -- Asegurarse de que las políticas permiten el join
    DROP POLICY IF EXISTS "Anyone can view files with user info" ON files;
    
    CREATE POLICY "Anyone can view files with user info" ON files
        FOR SELECT TO authenticated
        USING (true);
END
$$;

-- 7. Corregir la tabla users para permitir consultas con filtros
DO $$
BEGIN
    -- Asegurarse de que las políticas permiten filtros
    DROP POLICY IF EXISTS "Anyone can view users" ON users;
    
    CREATE POLICY "Anyone can view users" ON users
        FOR SELECT TO authenticated
        USING (true);
        
    -- Asegurarse de que la columna is_active existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active' AND table_schema = 'public') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Asegurarse de que las columnas first_name y last_name existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'first_name' AND table_schema = 'public') THEN
        ALTER TABLE users ADD COLUMN first_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_name' AND table_schema = 'public') THEN
        ALTER TABLE users ADD COLUMN last_name TEXT;
    END IF;
    
    -- Actualizar first_name y last_name desde raw_user_meta_data si están vacíos
    UPDATE users u
    SET first_name = a.raw_user_meta_data->>'first_name',
        last_name = a.raw_user_meta_data->>'last_name'
    FROM auth.users a
    WHERE u.id = a.id
    AND (u.first_name IS NULL OR u.last_name IS NULL);
END
$$;

-- 8. Verificar y corregir la tabla organization_settings
DO $$
DECLARE
    setting_key_exists BOOLEAN;
    key_exists BOOLEAN;
BEGIN
    -- Verificar qué columnas tiene la tabla
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organization_settings' 
        AND column_name = 'setting_key' 
        AND table_schema = 'public'
    ) INTO setting_key_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organization_settings' 
        AND column_name = 'key' 
        AND table_schema = 'public'
    ) INTO key_exists;
    
    -- Crear una vista compatible con las consultas que esperan key y value
    IF setting_key_exists AND NOT key_exists THEN
        EXECUTE 'CREATE OR REPLACE VIEW organization_settings_view AS 
                SELECT id, setting_key as key, setting_value as value, description, created_at, updated_at
                FROM organization_settings';
                
        -- Actualizar las políticas RLS para la vista
        EXECUTE 'CREATE POLICY "Anyone can view organization_settings_view" ON organization_settings_view 
                FOR SELECT TO authenticated 
                USING (true)';
    END IF;
END
$$;
