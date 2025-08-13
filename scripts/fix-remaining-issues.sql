-- Script para corregir los problemas restantes en las tablas del panel de administración

-- 1. Crear una vista para user_roles que exponga la columna 'role' en lugar de 'role_id'
CREATE OR REPLACE VIEW user_roles_view AS 
SELECT id, user_id, role_id AS role, created_at, updated_at
FROM user_roles;

-- 2. Configurar permisos para la vista
GRANT SELECT ON user_roles_view TO authenticated;

-- 3. Verificar y corregir organization_settings
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Verificar si la tabla existe
    SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'organization_settings'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Deshabilitar RLS temporalmente
        EXECUTE 'ALTER TABLE organization_settings DISABLE ROW LEVEL SECURITY';
        
        -- Eliminar la tabla
        EXECUTE 'DROP TABLE organization_settings CASCADE';
    END IF;
    
    -- Crear la tabla con la estructura correcta
    CREATE TABLE organization_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key TEXT NOT NULL UNIQUE,
        value TEXT,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Insertar datos iniciales
    INSERT INTO organization_settings (key, value, description)
    VALUES 
    ('organization_name', 'ClonDropbox', 'Nombre de la organización'),
    ('max_users', '100', 'Número máximo de usuarios permitidos'),
    ('storage_provider', 'supabase', 'Proveedor de almacenamiento');
    
    -- Habilitar RLS
    ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
    
    -- Crear políticas
    CREATE POLICY "Anyone can view organization_settings" ON organization_settings
        FOR SELECT TO authenticated
        USING (true);
    
    CREATE POLICY "Admins can manage organization_settings" ON organization_settings
        FOR ALL TO authenticated
        USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role_id = 'admin'))
        WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role_id = 'admin'));
END
$$;

-- 4. Verificar y corregir quota_settings
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Verificar si la tabla existe
    SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'quota_settings'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Deshabilitar RLS temporalmente
        EXECUTE 'ALTER TABLE quota_settings DISABLE ROW LEVEL SECURITY';
        
        -- Eliminar la tabla
        EXECUTE 'DROP TABLE quota_settings CASCADE';
    END IF;
    
    -- Crear la tabla con la estructura correcta
    CREATE TABLE quota_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role TEXT NOT NULL UNIQUE,
        storage_limit BIGINT NOT NULL,
        file_count_limit INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Insertar datos iniciales
    INSERT INTO quota_settings (role, storage_limit, file_count_limit)
    VALUES 
    ('admin', 10737418240, 1000), -- 10 GB para administradores
    ('user', 1073741824, 100);    -- 1 GB para usuarios normales
    
    -- Habilitar RLS
    ALTER TABLE quota_settings ENABLE ROW LEVEL SECURITY;
    
    -- Crear políticas
    CREATE POLICY "Anyone can view quota_settings" ON quota_settings
        FOR SELECT TO authenticated
        USING (true);
    
    CREATE POLICY "Admins can manage quota_settings" ON quota_settings
        FOR ALL TO authenticated
        USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role_id = 'admin'))
        WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role_id = 'admin'));
END
$$;

-- 5. Verificar y corregir feature_flags
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Verificar si la tabla existe
    SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'feature_flags'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Deshabilitar RLS temporalmente
        EXECUTE 'ALTER TABLE feature_flags DISABLE ROW LEVEL SECURITY';
        
        -- Eliminar la tabla
        EXECUTE 'DROP TABLE feature_flags CASCADE';
    END IF;
    
    -- Crear la tabla con la estructura correcta
    CREATE TABLE feature_flags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        enabled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Insertar datos iniciales
    INSERT INTO feature_flags (name, description, enabled)
    VALUES 
    ('enable_sharing', 'Permite a los usuarios compartir archivos', TRUE),
    ('enable_versioning', 'Permite el control de versiones de archivos', FALSE),
    ('enable_public_links', 'Permite crear enlaces públicos a archivos', TRUE);
    
    -- Habilitar RLS
    ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
    
    -- Crear políticas
    CREATE POLICY "Anyone can view feature_flags" ON feature_flags
        FOR SELECT TO authenticated
        USING (true);
    
    CREATE POLICY "Admins can manage feature_flags" ON feature_flags
        FOR ALL TO authenticated
        USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role_id = 'admin'))
        WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role_id = 'admin'));
END
$$;
