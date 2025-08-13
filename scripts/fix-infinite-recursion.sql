-- Script para solucionar el problema de recursión infinita en las políticas RLS
-- Este script:
-- 1. Deshabilita temporalmente RLS para todas las tablas
-- 2. Elimina todas las políticas existentes
-- 3. Crea políticas simplificadas que no causan recursión infinita
-- 4. Verifica que el usuario tenga el rol de administrador

-- Deshabilitar RLS temporalmente para todas las operaciones
ALTER TABLE IF EXISTS user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS role_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organization_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quota_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feature_flags DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Anyone can view their own user_role" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage user_roles" ON user_roles;
DROP POLICY IF EXISTS "Anyone can view user_roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete all roles" ON user_roles;

DROP POLICY IF EXISTS "Anyone can view roles" ON roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON roles;

DROP POLICY IF EXISTS "Anyone can view permissions" ON permissions;
DROP POLICY IF EXISTS "Admins can manage permissions" ON permissions;

DROP POLICY IF EXISTS "Anyone can view role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "Admins can manage role_permissions" ON role_permissions;

DROP POLICY IF EXISTS "Anyone can view organization_settings" ON organization_settings;
DROP POLICY IF EXISTS "Admins can manage organization_settings" ON organization_settings;

DROP POLICY IF EXISTS "Anyone can view quota_settings" ON quota_settings;
DROP POLICY IF EXISTS "Admins can manage quota_settings" ON quota_settings;

DROP POLICY IF EXISTS "Anyone can view feature_flags" ON feature_flags;
DROP POLICY IF EXISTS "Admins can manage feature_flags" ON feature_flags;

DROP POLICY IF EXISTS "Anyone can view audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can manage audit_logs" ON audit_logs;

-- Asegurarse de que el usuario tenga el rol de administrador sin usar RLS
-- Esto es importante para evitar el problema de recursión infinita
INSERT INTO user_roles (user_id, role)
VALUES ('b07f967a-7995-4210-ab80-4a5619419935', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Habilitar RLS para todas las tablas
ALTER TABLE IF EXISTS user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quota_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;

-- Crear políticas simplificadas que no causan recursión infinita
-- Para user_roles, usamos auth.uid() directamente sin consultar la misma tabla
CREATE POLICY "Users can view their own role" ON user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Para todas las demás tablas, permitimos acceso de lectura a todos los usuarios autenticados
CREATE POLICY "Anyone can view roles" ON roles
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Anyone can view permissions" ON permissions
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Anyone can view role_permissions" ON role_permissions
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Anyone can view organization_settings" ON organization_settings
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Anyone can view quota_settings" ON quota_settings
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Anyone can view feature_flags" ON feature_flags
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Anyone can view audit_logs" ON audit_logs
    FOR SELECT TO authenticated
    USING (true);

-- Verificar el rol del usuario
SELECT * FROM user_roles 
WHERE user_id = 'b07f967a-7995-4210-ab80-4a5619419935';
