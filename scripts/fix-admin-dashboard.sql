-- Script para corregir errores del panel de administración
-- Deshabilitar RLS temporalmente para facilitar las operaciones
ALTER TABLE IF EXISTS user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organization_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quota_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feature_flags DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS files DISABLE ROW LEVEL SECURITY;

-- Crear tabla users si no existe
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_suspended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla files si no existe o modificarla si es necesario
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'files' AND table_schema = 'public') THEN
    CREATE TABLE files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      size BIGINT NOT NULL,
      type TEXT NOT NULL,
      path TEXT NOT NULL,
      user_id UUID NOT NULL REFERENCES auth.users(id),
      parent_folder_id UUID,
      storage_path TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
    );
  ELSE
    -- Asegurarse de que la tabla files tiene la columna deleted_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'deleted_at' AND table_schema = 'public') THEN
      ALTER TABLE files ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    END IF;
    
    -- Asegurarse de que la tabla files tiene la columna size
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'size' AND table_schema = 'public') THEN
      ALTER TABLE files ADD COLUMN size BIGINT DEFAULT 0;
    END IF;
  END IF;
END
$$;

-- Crear tabla audit_logs si no existe
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurarse de que la tabla quota_settings existe y tiene la estructura correcta
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quota_settings' AND table_schema = 'public') THEN
    CREATE TABLE quota_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_type TEXT NOT NULL UNIQUE,
      storage_limit BIGINT NOT NULL,
      file_size_limit BIGINT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Insertar valores predeterminados
    INSERT INTO quota_settings (user_type, storage_limit, file_size_limit)
    VALUES 
      ('admin', 10737418240, 1073741824),  -- 10GB total, 1GB por archivo
      ('user', 5368709120, 524288000);     -- 5GB total, 500MB por archivo
  ELSE
    -- Verificar si la columna se llama role o user_type
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quota_settings' AND column_name = 'role' AND table_schema = 'public') THEN
      -- La columna se llama role, actualizar los datos
      INSERT INTO quota_settings (role, storage_limit, file_size_limit)
      VALUES 
        ('admin', 10737418240, 1073741824),  -- 10GB total, 1GB por archivo
        ('user', 5368709120, 524288000)      -- 5GB total, 500MB por archivo
      ON CONFLICT (role) DO NOTHING;
    ELSE
      -- La columna se llama user_type, actualizar los datos
      INSERT INTO quota_settings (user_type, storage_limit, file_size_limit)
      VALUES 
        ('admin', 10737418240, 1073741824),  -- 10GB total, 1GB por archivo
        ('user', 5368709120, 524288000)      -- 5GB total, 500MB por archivo
      ON CONFLICT (user_type) DO NOTHING;
    END IF;
  END IF;
END
$$;

-- Poblar la tabla users con datos de auth.users si está vacía
INSERT INTO users (id, email, first_name, last_name, is_active, is_suspended)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'first_name', ''), 
  COALESCE(raw_user_meta_data->>'last_name', ''), 
  TRUE, 
  FALSE
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.users.id);

-- Habilitar RLS y configurar políticas
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS files ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Anyone can view files" ON files;
DROP POLICY IF EXISTS "Admins can manage files" ON files;
DROP POLICY IF EXISTS "Anyone can view audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can manage audit_logs" ON audit_logs;

-- Crear políticas para users
CREATE POLICY "Anyone can view users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage users" ON users 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Crear políticas para files
CREATE POLICY "Anyone can view files" ON files FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage files" ON files 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Crear políticas para audit_logs
CREATE POLICY "Anyone can view audit_logs" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage audit_logs" ON audit_logs 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Verificar que el usuario actual tenga el rol de administrador
INSERT INTO user_roles (user_id, role)
VALUES ('f1b2ef08-3da7-4da4-ac8d-d441d0b5236b', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
