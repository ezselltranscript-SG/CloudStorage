-- Script para limpiar y simplificar las políticas RLS de user_roles
-- Este script:
-- 1. Elimina todas las políticas existentes
-- 2. Crea solo las políticas necesarias
-- 3. Verifica que el usuario tenga el rol de administrador

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Anyone can view their own user_role" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage user_roles" ON user_roles;
DROP POLICY IF EXISTS "Anyone can view user_roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;

-- Crear solo las políticas necesarias
-- 1. Política para que los usuarios puedan ver su propio rol
CREATE POLICY "Users can view their own role" ON user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- 2. Política para que los administradores puedan ver todos los roles
CREATE POLICY "Admins can view all roles" ON user_roles
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- 3. Política para que los administradores puedan gestionar todos los roles
CREATE POLICY "Admins can manage all roles" ON user_roles
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can update all roles" ON user_roles
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can delete all roles" ON user_roles
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Asegurarse de que el usuario tenga el rol de administrador
INSERT INTO user_roles (user_id, role)
VALUES ('b07f967a-7995-4210-ab80-4a5619419935', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Verificar las políticas
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'user_roles';

-- Verificar el rol del usuario
SELECT * FROM user_roles 
WHERE user_id = 'b07f967a-7995-4210-ab80-4a5619419935';
