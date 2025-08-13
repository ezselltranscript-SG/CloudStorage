-- Script completo para corregir todos los problemas del panel de administración
-- Este script:
-- 1. Elimina todas las tablas necesarias para el panel de administración
-- 2. Las recrea con la estructura correcta
-- 3. Inserta datos iniciales
-- 4. Configura las políticas RLS correctamente
-- 5. Crea una vista para compatibilidad con el código frontend

-- Deshabilitar RLS temporalmente para todas las operaciones
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Verificar y eliminar tablas existentes
    EXECUTE 'ALTER TABLE IF EXISTS user_roles DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS roles DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS permissions DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS role_permissions DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS organization_settings DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS quota_settings DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS feature_flags DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY';
    
    -- Eliminar vistas si existen
    DROP VIEW IF EXISTS user_roles_view;
    
    -- Eliminar tablas si existen
    DROP TABLE IF EXISTS user_roles CASCADE;
    DROP TABLE IF EXISTS role_permissions CASCADE;
    DROP TABLE IF EXISTS permissions CASCADE;
    DROP TABLE IF EXISTS roles CASCADE;
    DROP TABLE IF EXISTS organization_settings CASCADE;
    DROP TABLE IF EXISTS quota_settings CASCADE;
    DROP TABLE IF EXISTS feature_flags CASCADE;
    DROP TABLE IF EXISTS audit_logs CASCADE;
END
$$;

-- 1. Crear tabla de roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de permisos
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla de relación entre roles y permisos
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- 4. Crear tabla de roles de usuario
-- IMPORTANTE: Esta tabla debe tener una columna 'role' (no role_id) para que funcione con el frontend
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,  -- Usar 'role' en lugar de 'role_id' para compatibilidad con el frontend
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 5. Crear tabla de configuración de la organización
CREATE TABLE organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Crear tabla de cuotas
CREATE TABLE quota_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL UNIQUE,
    storage_limit BIGINT NOT NULL,
    file_count_limit INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Crear tabla de características (feature flags)
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Crear tabla de logs de auditoría
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar datos iniciales en roles
INSERT INTO roles (name, description)
VALUES 
('admin', 'Administrador con acceso completo'),
('user', 'Usuario estándar');

-- Insertar datos iniciales en permisos
INSERT INTO permissions (name, description)
VALUES 
('manage_users', 'Gestionar usuarios'),
('manage_files', 'Gestionar archivos'),
('manage_settings', 'Gestionar configuración'),
('view_dashboard', 'Ver dashboard'),
('download_files', 'Descargar archivos'),
('upload_files', 'Subir archivos'),
('delete_files', 'Eliminar archivos'),
('share_files', 'Compartir archivos');

-- Asignar permisos a roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'user' AND p.name IN ('view_dashboard', 'download_files', 'upload_files', 'share_files');

-- Insertar datos iniciales en configuración de la organización
INSERT INTO organization_settings (key, value, description)
VALUES 
('organization_name', 'ClonDropbox', 'Nombre de la organización'),
('max_users', '100', 'Número máximo de usuarios permitidos'),
('storage_provider', 'supabase', 'Proveedor de almacenamiento');

-- Insertar datos iniciales en cuotas
INSERT INTO quota_settings (role, storage_limit, file_count_limit)
VALUES 
('admin', 10737418240, 1000), -- 10 GB para administradores
('user', 1073741824, 100);    -- 1 GB para usuarios normales

-- Insertar datos iniciales en feature flags
INSERT INTO feature_flags (name, description, enabled)
VALUES 
('enable_sharing', 'Permite a los usuarios compartir archivos', TRUE),
('enable_versioning', 'Permite el control de versiones de archivos', FALSE),
('enable_public_links', 'Permite crear enlaces públicos a archivos', TRUE);

-- Habilitar RLS para todas las tablas
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quota_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para roles
CREATE POLICY "Anyone can view roles" ON roles
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage roles" ON roles
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Crear políticas RLS para permisos
CREATE POLICY "Anyone can view permissions" ON permissions
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage permissions" ON permissions
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Crear políticas RLS para role_permissions
CREATE POLICY "Anyone can view role_permissions" ON role_permissions
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage role_permissions" ON role_permissions
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Crear políticas RLS para user_roles
CREATE POLICY "Anyone can view user_roles" ON user_roles
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage user_roles" ON user_roles
    FOR ALL TO authenticated
    USING (
        -- Para operaciones SELECT, UPDATE, DELETE
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    )
    WITH CHECK (
        -- Para operaciones INSERT, UPDATE
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

-- Crear políticas RLS para organization_settings
CREATE POLICY "Anyone can view organization_settings" ON organization_settings
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage organization_settings" ON organization_settings
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Crear políticas RLS para quota_settings
CREATE POLICY "Anyone can view quota_settings" ON quota_settings
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage quota_settings" ON quota_settings
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Crear políticas RLS para feature_flags
CREATE POLICY "Anyone can view feature_flags" ON feature_flags
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage feature_flags" ON feature_flags
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Crear políticas RLS para audit_logs
CREATE POLICY "Anyone can view audit_logs" ON audit_logs
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage audit_logs" ON audit_logs
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Asignar rol de administrador a un usuario específico (reemplaza con tu UUID de usuario)
-- Si no tienes un usuario admin, puedes obtener el UUID desde la tabla auth.users
INSERT INTO user_roles (user_id, role)
VALUES 
('b07f967a-7995-4210-ab80-4a5619419935', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Verificar que todo se haya creado correctamente
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
