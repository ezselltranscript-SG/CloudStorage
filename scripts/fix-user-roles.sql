-- Script para corregir la estructura de user_roles y resolver errores 500

-- 1. Verificar la estructura actual
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
AND table_schema = 'public';

-- 2. Deshabilitar RLS temporalmente
ALTER TABLE IF EXISTS user_roles DISABLE ROW LEVEL SECURITY;

-- 3. Guardar datos existentes
CREATE TEMPORARY TABLE temp_user_roles AS
SELECT * FROM user_roles;

-- 4. Eliminar la tabla actual
DROP TABLE IF EXISTS user_roles CASCADE;

-- 5. Crear la tabla con la estructura correcta
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL, -- Cambiado de 'role' a 'role_id' para coincidir con lo que espera la aplicación
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- Añadir restricción única en user_id para permitir ON CONFLICT
);

-- 6. Restaurar datos
INSERT INTO user_roles (id, user_id, role_id, created_at, updated_at)
SELECT id, user_id, role, created_at, updated_at
FROM temp_user_roles;

-- 7. Asegurarse de que el usuario administrador tiene el rol correcto
INSERT INTO user_roles (user_id, role_id)
VALUES ('f1b2ef08-3da7-4da4-ac8d-d441d0b5236b', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role_id = 'admin';

-- 8. Habilitar RLS y crear políticas
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas para user_roles
DROP POLICY IF EXISTS "Anyone can view user_roles" ON user_roles;
CREATE POLICY "Anyone can view user_roles" ON user_roles
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage user_roles" ON user_roles;
CREATE POLICY "Admins can manage user_roles" ON user_roles
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role_id = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role_id = 'admin'));

-- 9. Verificar que la tabla tiene la estructura correcta
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
AND table_schema = 'public';
