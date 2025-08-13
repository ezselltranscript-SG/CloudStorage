-- Crear tabla user_roles si no existe
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Crear política RLS para la tabla user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Política para permitir a los usuarios ver su propio rol
CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para permitir a los administradores gestionar todos los roles
CREATE POLICY "Admins can manage all roles" ON user_roles
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Comentario de la tabla
COMMENT ON TABLE user_roles IS 'Tabla que almacena los roles de los usuarios para el sistema de permisos';
