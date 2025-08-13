-- Script para verificar y corregir problemas con la tabla user_roles
-- Este script:
-- 1. Verifica la estructura actual de la tabla user_roles
-- 2. Verifica si el usuario tiene asignado el rol de administrador
-- 3. Corrige cualquier problema encontrado

-- Verificar la estructura de la tabla user_roles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_roles';

-- Verificar si el usuario tiene asignado el rol de administrador
SELECT * FROM user_roles 
WHERE user_id = 'b07f967a-7995-4210-ab80-4a5619419935';

-- Asegurarse de que el usuario tenga el rol de administrador
INSERT INTO user_roles (user_id, role)
VALUES ('b07f967a-7995-4210-ab80-4a5619419935', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Verificar que la tabla user_roles tenga los permisos RLS correctos
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_roles';

-- Asegurarse de que RLS esté habilitado para la tabla user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Recrear las políticas RLS para user_roles
DROP POLICY IF EXISTS "Anyone can view their own user_role" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage user_roles" ON user_roles;

-- Crear política para que los usuarios puedan ver su propio rol
CREATE POLICY "Anyone can view their own user_role" ON user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    ));

-- Crear política para que los administradores puedan gestionar todos los roles
CREATE POLICY "Admins can manage user_roles" ON user_roles
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    ));

-- Verificar nuevamente las políticas
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_roles';
