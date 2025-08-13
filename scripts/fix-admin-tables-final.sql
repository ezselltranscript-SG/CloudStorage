-- Script final para corregir todas las tablas del panel de administración

-- Deshabilitar RLS temporalmente para facilitar las operaciones
ALTER TABLE IF EXISTS user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organization_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quota_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feature_flags DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS files DISABLE ROW LEVEL SECURITY;

-- Modificar tabla users si es necesario
DO $$
DECLARE
    table_exists BOOLEAN;
    first_name_exists BOOLEAN;
    last_name_exists BOOLEAN;
BEGIN
    -- Verificar si la tabla existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- La tabla existe, verificar qué columnas tiene
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'first_name' 
            AND table_schema = 'public'
        ) INTO first_name_exists;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'last_name' 
            AND table_schema = 'public'
        ) INTO last_name_exists;
        
        -- Agregar columnas si no existen
        IF NOT first_name_exists THEN
            ALTER TABLE users ADD COLUMN first_name TEXT;
        END IF;
        
        IF NOT last_name_exists THEN
            ALTER TABLE users ADD COLUMN last_name TEXT;
        END IF;
        
        -- Asegurarse de que la tabla users tiene la columna is_active
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active' AND table_schema = 'public') THEN
            ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        END IF;
        
        -- Asegurarse de que la tabla users tiene la columna is_suspended
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_suspended' AND table_schema = 'public') THEN
            ALTER TABLE users ADD COLUMN is_suspended BOOLEAN DEFAULT FALSE;
        END IF;
    ELSE
        -- La tabla no existe, crearla
        CREATE TABLE users (
            id UUID PRIMARY KEY REFERENCES auth.users(id),
            email TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            is_suspended BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- Modificar tabla files si es necesario para adaptarla a las necesidades del panel de administración
DO $$
BEGIN
  -- La tabla files ya existe con una estructura específica
  -- Verificar si necesita columnas adicionales para el panel de administración
  
  -- Asegurarse de que la tabla files tiene la columna deleted_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'deleted_at' AND table_schema = 'public') THEN
    ALTER TABLE files ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
  END IF;
  
  -- Asegurarse de que la tabla files tiene la columna size si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'size' AND table_schema = 'public') THEN
    ALTER TABLE files ADD COLUMN size BIGINT DEFAULT 0;
  END IF;
  
  -- Asegurarse de que la tabla files tiene la columna type si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'type' AND table_schema = 'public') THEN
    ALTER TABLE files ADD COLUMN type TEXT DEFAULT 'application/octet-stream';
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

-- Crear tabla feature_flags si no existe
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear o modificar tabla organization_settings
DO $$
DECLARE
    table_exists BOOLEAN;
    setting_key_exists BOOLEAN;
    key_exists BOOLEAN;
BEGIN
    -- Verificar si la tabla existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'organization_settings' 
        AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- La tabla existe, verificar qué columnas tiene
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
        
        IF NOT setting_key_exists AND NOT key_exists THEN
            -- No tiene ninguna de las columnas esperadas, agregar la columna setting_key
            ALTER TABLE organization_settings ADD COLUMN setting_key TEXT;
            ALTER TABLE organization_settings ADD COLUMN setting_value TEXT;
        END IF;
    ELSE
        -- La tabla no existe, crearla
        CREATE TABLE organization_settings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            setting_key TEXT NOT NULL,
            setting_value TEXT,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- Insertar valores predeterminados en feature_flags
DO $$
BEGIN
  -- Verificar si la tabla tiene una restricción única en name
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.contype = 'u' 
    AND c.conrelid = 'feature_flags'::regclass
    AND array_position(c.conkey, (
      SELECT attnum FROM pg_attribute 
      WHERE attrelid = 'feature_flags'::regclass AND attname = 'name'
    )) IS NOT NULL
  ) THEN
    -- Si tiene la restricción única, usar ON CONFLICT
    INSERT INTO feature_flags (name, description, enabled)
    VALUES 
      ('enable_sharing', 'Permite a los usuarios compartir archivos', TRUE),
      ('enable_versioning', 'Permite el control de versiones de archivos', FALSE),
      ('enable_public_links', 'Permite crear enlaces públicos a archivos', TRUE)
    ON CONFLICT (name) DO NOTHING;
  ELSE
    -- Si no tiene la restricción única, insertar verificando primero
    IF NOT EXISTS (SELECT 1 FROM feature_flags WHERE name = 'enable_sharing') THEN
      INSERT INTO feature_flags (name, description, enabled)
      VALUES ('enable_sharing', 'Permite a los usuarios compartir archivos', TRUE);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM feature_flags WHERE name = 'enable_versioning') THEN
      INSERT INTO feature_flags (name, description, enabled)
      VALUES ('enable_versioning', 'Permite el control de versiones de archivos', FALSE);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM feature_flags WHERE name = 'enable_public_links') THEN
      INSERT INTO feature_flags (name, description, enabled)
      VALUES ('enable_public_links', 'Permite crear enlaces públicos a archivos', TRUE);
    END IF;
  END IF;
END
$$;

-- Insertar valores predeterminados en organization_settings
DO $$
DECLARE
    setting_key_exists BOOLEAN;
    key_exists BOOLEAN;
    description_exists BOOLEAN;
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
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organization_settings' 
        AND column_name = 'description' 
        AND table_schema = 'public'
    ) INTO description_exists;
    
    IF setting_key_exists THEN
        -- Usar la columna setting_key
        IF description_exists THEN
            -- Si existe la columna description
            IF NOT EXISTS (SELECT 1 FROM organization_settings WHERE setting_key = 'organization_name') THEN
                INSERT INTO organization_settings (setting_key, setting_value, description)
                VALUES ('organization_name', 'ClonDropbox', 'Nombre de la organización');
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM organization_settings WHERE setting_key = 'max_users') THEN
                INSERT INTO organization_settings (setting_key, setting_value, description)
                VALUES ('max_users', '100', 'Número máximo de usuarios permitidos');
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM organization_settings WHERE setting_key = 'storage_provider') THEN
                INSERT INTO organization_settings (setting_key, setting_value, description)
                VALUES ('storage_provider', 'supabase', 'Proveedor de almacenamiento');
            END IF;
        ELSE
            -- Sin columna description
            IF NOT EXISTS (SELECT 1 FROM organization_settings WHERE setting_key = 'organization_name') THEN
                INSERT INTO organization_settings (setting_key, setting_value)
                VALUES ('organization_name', 'ClonDropbox');
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM organization_settings WHERE setting_key = 'max_users') THEN
                INSERT INTO organization_settings (setting_key, setting_value)
                VALUES ('max_users', '100');
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM organization_settings WHERE setting_key = 'storage_provider') THEN
                INSERT INTO organization_settings (setting_key, setting_value)
                VALUES ('storage_provider', 'supabase');
            END IF;
        END IF;
    ELSIF key_exists THEN
        -- Usar la columna key
        IF description_exists THEN
            -- Si existe la columna description
            IF NOT EXISTS (SELECT 1 FROM organization_settings WHERE key = 'organization_name') THEN
                INSERT INTO organization_settings (key, value, description)
                VALUES ('organization_name', 'ClonDropbox', 'Nombre de la organización');
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM organization_settings WHERE key = 'max_users') THEN
                INSERT INTO organization_settings (key, value, description)
                VALUES ('max_users', '100', 'Número máximo de usuarios permitidos');
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM organization_settings WHERE key = 'storage_provider') THEN
                INSERT INTO organization_settings (key, value, description)
                VALUES ('storage_provider', 'supabase', 'Proveedor de almacenamiento');
            END IF;
        ELSE
            -- Sin columna description
            IF NOT EXISTS (SELECT 1 FROM organization_settings WHERE key = 'organization_name') THEN
                INSERT INTO organization_settings (key, value)
                VALUES ('organization_name', 'ClonDropbox');
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM organization_settings WHERE key = 'max_users') THEN
                INSERT INTO organization_settings (key, value)
                VALUES ('max_users', '100');
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM organization_settings WHERE key = 'storage_provider') THEN
                INSERT INTO organization_settings (key, value)
                VALUES ('storage_provider', 'supabase');
            END IF;
        END IF;
    ELSE
        -- No tiene ninguna de las columnas esperadas, mostrar un mensaje
        RAISE NOTICE 'La tabla organization_settings no tiene las columnas esperadas (key o setting_key)';
    END IF;
END
$$;

-- Poblar la tabla users con datos de auth.users si está vacía
DO $$
DECLARE
    first_name_exists BOOLEAN;
    last_name_exists BOOLEAN;
    is_active_exists BOOLEAN;
    is_suspended_exists BOOLEAN;
    hashed_password_exists BOOLEAN;
    hashed_password_required BOOLEAN;
    column_record RECORD;
    column_names TEXT := '';
    insert_columns TEXT := '';
    select_columns TEXT := '';
BEGIN
    -- Verificar si la columna hashed_password existe y si es obligatoria
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'hashed_password' 
        AND table_schema = 'public'
    ) INTO hashed_password_exists;
    
    IF hashed_password_exists THEN
        SELECT is_nullable = 'NO' INTO hashed_password_required
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'hashed_password'
        AND table_schema = 'public';
    END IF;
    
    -- Si hashed_password es obligatorio, no podemos insertar usuarios
    -- porque no tenemos acceso a las contraseñas hasheadas en auth.users
    IF hashed_password_exists AND hashed_password_required THEN
        RAISE NOTICE 'No se pueden insertar usuarios porque la columna hashed_password es obligatoria';
        RETURN;
    END IF;
    
    -- Obtener todas las columnas de la tabla users
    FOR column_record IN 
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
        AND column_name != 'hashed_password' -- Excluir la columna hashed_password
    LOOP
        IF column_names != '' THEN
            column_names := column_names || ', ';
        END IF;
        column_names := column_names || column_record.column_name;
    END LOOP;
    
    -- Construir la consulta de inserción dinámicamente
    -- Solo insertar usuarios que no existan ya en la tabla
    EXECUTE 'INSERT INTO users (id, email) '
            'SELECT id, email '
            'FROM auth.users '
            'WHERE id NOT IN (SELECT id FROM users)';
    
    -- Actualizar los campos adicionales si es necesario
    -- Esto evita el problema con hashed_password
    UPDATE users u
    SET first_name = a.raw_user_meta_data->>'first_name',
        last_name = a.raw_user_meta_data->>'last_name'
    FROM auth.users a
    WHERE u.id = a.id
    AND (u.first_name IS NULL OR u.last_name IS NULL);
    
    -- Actualizar is_active y is_suspended si existen
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active' AND table_schema = 'public') THEN
        UPDATE users SET is_active = TRUE WHERE is_active IS NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_suspended' AND table_schema = 'public') THEN
        UPDATE users SET is_suspended = FALSE WHERE is_suspended IS NULL;
    END IF;
END
$$;

-- Verificar que el usuario actual tenga el rol de administrador
INSERT INTO user_roles (user_id, role)
VALUES ('f1b2ef08-3da7-4da4-ac8d-d441d0b5236b', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Habilitar RLS y configurar políticas
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS files ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quota_settings ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Anyone can view files" ON files;
DROP POLICY IF EXISTS "Admins can manage files" ON files;
DROP POLICY IF EXISTS "Anyone can view audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can manage audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Anyone can view feature_flags" ON feature_flags;
DROP POLICY IF EXISTS "Admins can manage feature_flags" ON feature_flags;
DROP POLICY IF EXISTS "Anyone can view organization_settings" ON organization_settings;
DROP POLICY IF EXISTS "Admins can manage organization_settings" ON organization_settings;
DROP POLICY IF EXISTS "Anyone can view quota_settings" ON quota_settings;
DROP POLICY IF EXISTS "Admins can manage quota_settings" ON quota_settings;

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

-- Crear políticas para feature_flags
CREATE POLICY "Anyone can view feature_flags" ON feature_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage feature_flags" ON feature_flags 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Crear políticas para organization_settings
CREATE POLICY "Anyone can view organization_settings" ON organization_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage organization_settings" ON organization_settings 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Crear políticas para quota_settings
CREATE POLICY "Anyone can view quota_settings" ON quota_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage quota_settings" ON quota_settings 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
