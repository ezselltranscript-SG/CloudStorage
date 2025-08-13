-- Script para recrear todas las tablas del panel de administración desde cero

-- 1. Primero deshabilitamos RLS en todas las tablas existentes para evitar problemas
ALTER TABLE IF EXISTS user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organization_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quota_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feature_flags DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS files DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS role_permissions DISABLE ROW LEVEL SECURITY;

-- 2. Eliminamos las tablas existentes en orden inverso para evitar problemas de dependencia
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS feature_flags CASCADE;
DROP TABLE IF EXISTS quota_settings CASCADE;
DROP TABLE IF EXISTS organization_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
-- No eliminamos la tabla files ya que podría contener datos importantes

-- 3. Creamos la tabla users vinculada a auth.users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_suspended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Creamos la tabla roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Creamos la tabla user_roles
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Creamos la tabla permissions
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Creamos la tabla role_permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- 8. Creamos la tabla organization_settings
CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Creamos la tabla quota_settings
CREATE TABLE IF NOT EXISTS quota_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL UNIQUE,
    storage_limit BIGINT NOT NULL,
    file_count_limit INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Creamos la tabla feature_flags
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Creamos la tabla audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT
);

-- 12. Verificamos si la tabla files existe, si no, la creamos
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'files') THEN
        CREATE TABLE files (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            filename TEXT NOT NULL,
            folder_id UUID,
            storage_path TEXT NOT NULL,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            type TEXT,
            size BIGINT DEFAULT 0,
            deleted_at TIMESTAMP WITH TIME ZONE
        );
    END IF;
END
$$;

-- 13. Insertamos datos iniciales en las tablas

-- Roles
INSERT INTO roles (name, description)
VALUES 
('admin', 'Administrador con acceso completo'),
('user', 'Usuario estándar')
ON CONFLICT (name) DO NOTHING;

-- Permisos
INSERT INTO permissions (name, description)
VALUES 
('manage_users', 'Gestionar usuarios'),
('manage_files', 'Gestionar archivos'),
('view_dashboard', 'Ver panel de control'),
('manage_settings', 'Gestionar configuraciones')
ON CONFLICT (name) DO NOTHING;

-- Configuraciones de la organización
INSERT INTO organization_settings (key, value, description)
VALUES 
('organization_name', 'ClonDropbox', 'Nombre de la organización'),
('max_users', '100', 'Número máximo de usuarios permitidos'),
('storage_provider', 'supabase', 'Proveedor de almacenamiento')
ON CONFLICT (key) DO NOTHING;

-- Configuraciones de cuota
INSERT INTO quota_settings (role, storage_limit, file_count_limit)
VALUES 
('admin', 10737418240, 1000), -- 10 GB para administradores
('user', 1073741824, 100)     -- 1 GB para usuarios normales
ON CONFLICT (role) DO NOTHING;

-- Banderas de características
INSERT INTO feature_flags (name, description, enabled)
VALUES 
('enable_sharing', 'Permite a los usuarios compartir archivos', TRUE),
('enable_versioning', 'Permite el control de versiones de archivos', FALSE),
('enable_public_links', 'Permite crear enlaces públicos a archivos', TRUE)
ON CONFLICT (name) DO NOTHING;

-- 14. Insertamos usuarios desde auth.users
INSERT INTO users (id, email, first_name, last_name, is_active)
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data->>'first_name',
    au.raw_user_meta_data->>'last_name',
    TRUE
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL;

-- 15. Asignamos rol de administrador al usuario específico
INSERT INTO user_roles (user_id, role)
VALUES ('f1b2ef08-3da7-4da4-ac8d-d441d0b5236b', 'admin')
ON CONFLICT DO NOTHING;

-- 16. Habilitamos RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quota_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- 17. Creamos políticas RLS para cada tabla

-- Políticas para users
DROP POLICY IF EXISTS "Anyone can view users" ON users;
CREATE POLICY "Anyone can view users" ON users
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage users" ON users;
CREATE POLICY "Admins can manage users" ON users
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Políticas para roles
DROP POLICY IF EXISTS "Anyone can view roles" ON roles;
CREATE POLICY "Anyone can view roles" ON roles
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage roles" ON roles;
CREATE POLICY "Admins can manage roles" ON roles
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Políticas para user_roles
DROP POLICY IF EXISTS "Anyone can view user_roles" ON user_roles;
CREATE POLICY "Anyone can view user_roles" ON user_roles
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage user_roles" ON user_roles;
CREATE POLICY "Admins can manage user_roles" ON user_roles
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Políticas para permissions
DROP POLICY IF EXISTS "Anyone can view permissions" ON permissions;
CREATE POLICY "Anyone can view permissions" ON permissions
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage permissions" ON permissions;
CREATE POLICY "Admins can manage permissions" ON permissions
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Políticas para role_permissions
DROP POLICY IF EXISTS "Anyone can view role_permissions" ON role_permissions;
CREATE POLICY "Anyone can view role_permissions" ON role_permissions
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage role_permissions" ON role_permissions;
CREATE POLICY "Admins can manage role_permissions" ON role_permissions
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Políticas para organization_settings
DROP POLICY IF EXISTS "Anyone can view organization_settings" ON organization_settings;
CREATE POLICY "Anyone can view organization_settings" ON organization_settings
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage organization_settings" ON organization_settings;
CREATE POLICY "Admins can manage organization_settings" ON organization_settings
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Políticas para quota_settings
DROP POLICY IF EXISTS "Anyone can view quota_settings" ON quota_settings;
CREATE POLICY "Anyone can view quota_settings" ON quota_settings
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage quota_settings" ON quota_settings;
CREATE POLICY "Admins can manage quota_settings" ON quota_settings
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Políticas para feature_flags
DROP POLICY IF EXISTS "Anyone can view feature_flags" ON feature_flags;
CREATE POLICY "Anyone can view feature_flags" ON feature_flags
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage feature_flags" ON feature_flags;
CREATE POLICY "Admins can manage feature_flags" ON feature_flags
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Políticas para audit_logs
DROP POLICY IF EXISTS "Anyone can view audit_logs" ON audit_logs;
CREATE POLICY "Anyone can view audit_logs" ON audit_logs
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage audit_logs" ON audit_logs;
CREATE POLICY "Admins can manage audit_logs" ON audit_logs
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Políticas para files (solo si no existen ya)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'files' AND policyname = 'Anyone can view files') THEN
        EXECUTE 'CREATE POLICY "Anyone can view files" ON files
                FOR SELECT TO authenticated
                USING (true)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'files' AND policyname = 'Users can manage their own files') THEN
        EXECUTE 'CREATE POLICY "Users can manage their own files" ON files
                FOR ALL TO authenticated
                USING (auth.uid() = user_id)
                WITH CHECK (auth.uid() = user_id)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'files' AND policyname = 'Admins can manage all files') THEN
        EXECUTE 'CREATE POLICY "Admins can manage all files" ON files
                FOR ALL TO authenticated
                USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ''admin''))
                WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ''admin''))';
    END IF;
END
$$;

-- 18. Crear vistas para compatibilidad con la aplicación
CREATE OR REPLACE VIEW user_roles_view AS 
SELECT user_id, role as role_id 
FROM user_roles;

-- 19. Nota: Las vistas no admiten políticas RLS directamente
-- La vista user_roles_view heredará los permisos de la tabla subyacente user_roles
