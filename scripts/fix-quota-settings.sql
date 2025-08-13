-- Script para verificar y corregir la estructura de quota_settings

-- Primero, verificar la estructura actual de la tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quota_settings' 
AND table_schema = 'public';

-- Deshabilitar RLS temporalmente
ALTER TABLE IF EXISTS quota_settings DISABLE ROW LEVEL SECURITY;

-- Verificar si la tabla existe, y si no, crearla con la estructura correcta
DO $$
DECLARE
    column_exists BOOLEAN;
    column_record RECORD;
BEGIN
    -- Verificar si la tabla existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quota_settings' AND table_schema = 'public') THEN
        -- La tabla existe, verificar qué columna tiene para el tipo de usuario
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'quota_settings' 
            AND column_name = 'role' 
            AND table_schema = 'public'
        ) INTO column_exists;
        
        IF column_exists THEN
            -- La columna se llama 'role'
            RAISE NOTICE 'La tabla quota_settings tiene la columna role';
            
            -- Insertar datos usando la columna role
            INSERT INTO quota_settings (role, storage_limit, file_size_limit)
            VALUES 
                ('admin', 10737418240, 1073741824),  -- 10GB total, 1GB por archivo
                ('user', 5368709120, 524288000)      -- 5GB total, 500MB por archivo
            ON CONFLICT (role) DO NOTHING;
        ELSE
            -- Verificar si tiene la columna user_type
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'quota_settings' 
                AND column_name = 'user_type' 
                AND table_schema = 'public'
            ) INTO column_exists;
            
            IF column_exists THEN
                -- La columna se llama 'user_type'
                RAISE NOTICE 'La tabla quota_settings tiene la columna user_type';
                
                -- Insertar datos usando la columna user_type
                INSERT INTO quota_settings (user_type, storage_limit, file_size_limit)
                VALUES 
                    ('admin', 10737418240, 1073741824),  -- 10GB total, 1GB por archivo
                    ('user', 5368709120, 524288000)      -- 5GB total, 500MB por archivo
                ON CONFLICT (user_type) DO NOTHING;
            ELSE
                -- No tiene ninguna de las dos columnas esperadas, mostrar la estructura
                RAISE NOTICE 'La tabla quota_settings no tiene las columnas esperadas';
                
                -- Mostrar las columnas existentes
                RAISE NOTICE 'Columnas de quota_settings:';
                FOR column_record IN 
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'quota_settings' 
                    AND table_schema = 'public'
                LOOP
                    RAISE NOTICE '%', column_record.column_name;
                END LOOP;
            END IF;
        END IF;
    ELSE
        -- La tabla no existe, crearla
        RAISE NOTICE 'La tabla quota_settings no existe, creándola';
        
        CREATE TABLE quota_settings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            role TEXT NOT NULL UNIQUE,
            storage_limit BIGINT NOT NULL,
            file_size_limit BIGINT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insertar valores predeterminados
        INSERT INTO quota_settings (role, storage_limit, file_size_limit)
        VALUES 
            ('admin', 10737418240, 1073741824),  -- 10GB total, 1GB por archivo
            ('user', 5368709120, 524288000);     -- 5GB total, 500MB por archivo
    END IF;
END
$$;

-- Verificar los datos después de los cambios
SELECT * FROM quota_settings;

-- Habilitar RLS nuevamente
ALTER TABLE IF EXISTS quota_settings ENABLE ROW LEVEL SECURITY;

-- Crear política para quota_settings
DROP POLICY IF EXISTS "Anyone can view quota_settings" ON quota_settings;
DROP POLICY IF EXISTS "Admins can manage quota_settings" ON quota_settings;

CREATE POLICY "Anyone can view quota_settings" ON quota_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage quota_settings" ON quota_settings 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
