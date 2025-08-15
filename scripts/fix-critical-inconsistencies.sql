-- CORRECCIÓN DE INCONSISTENCIAS CRÍTICAS BD-STORAGE
-- Ejecutar en Supabase SQL Editor

-- =====================================================
-- 1. CORREGIR FILE IDs QUE NO COINCIDEN CON STORAGE
-- =====================================================
-- Actualizar storage_path para incluir el file ID correcto

-- Primero, ver qué archivos tienen el problema
SELECT 
    'ARCHIVOS_CON_ID_INCORRECTO' as problema,
    f.id as file_id,
    f.name as filename,
    f.storage_path as current_path,
    -- Generar el storage_path correcto
    CASE 
        WHEN f.folder_id IS NULL THEN 
            f.user_id::text || '/root/' || f.id::text || '.' || split_part(f.name, '.', array_length(string_to_array(f.name, '.'), 1))
        ELSE 
            -- Para archivos en carpetas, necesitamos la ruta completa
            f.user_id::text || '/folder_' || f.folder_id::text || '/' || f.id::text || '.' || split_part(f.name, '.', array_length(string_to_array(f.name, '.'), 1))
    END as correct_path
FROM files f
WHERE f.deleted_at IS NULL
  AND f.storage_path IS NOT NULL
  AND f.storage_path NOT LIKE '%/' || f.id::text || '.%'
ORDER BY f.name;

-- Actualizar los storage_paths incorrectos
UPDATE files 
SET storage_path = CASE 
    WHEN folder_id IS NULL THEN 
        user_id::text || '/root/' || id::text || '.' || split_part(name, '.', array_length(string_to_array(name, '.'), 1))
    ELSE 
        user_id::text || '/folder_' || folder_id::text || '/' || id::text || '.' || split_part(name, '.', array_length(string_to_array(name, '.'), 1))
END,
updated_at = NOW()
WHERE deleted_at IS NULL
  AND storage_path IS NOT NULL
  AND storage_path NOT LIKE '%/' || id::text || '.%';

-- Verificar el resultado
SELECT 
    'ARCHIVOS_CORREGIDOS' as resultado,
    COUNT(*) as archivos_actualizados
FROM files 
WHERE deleted_at IS NULL
  AND updated_at > NOW() - INTERVAL '1 minute'
  AND storage_path LIKE '%/' || id::text || '.%';

-- =====================================================
-- 2. CORREGIR REFERENCIAS ROTAS (ARCHIVOS HUÉRFANOS)
-- =====================================================
-- Mover archivos huérfanos a la carpeta raíz de su usuario

-- Primero, ver qué archivos están huérfanos
SELECT 
    'ARCHIVOS_HUERFANOS' as problema,
    f.id as file_id,
    f.name as filename,
    f.folder_id as folder_inexistente,
    f.user_id,
    'Carpeta padre no existe' as detalle
FROM files f
LEFT JOIN folders fold ON f.folder_id = fold.id AND fold.deleted_at IS NULL
WHERE f.deleted_at IS NULL
  AND f.folder_id IS NOT NULL
  AND fold.id IS NULL
ORDER BY f.name;

-- Mover archivos huérfanos a carpeta raíz y actualizar storage_path
UPDATE files 
SET 
    folder_id = NULL,
    storage_path = user_id::text || '/root/' || id::text || '.' || split_part(name, '.', array_length(string_to_array(name, '.'), 1)),
    updated_at = NOW()
WHERE deleted_at IS NULL
  AND folder_id IS NOT NULL
  AND folder_id NOT IN (
    SELECT id FROM folders WHERE deleted_at IS NULL
  );

-- Verificar el resultado
SELECT 
    'ARCHIVOS_MOVIDOS_A_RAIZ' as resultado,
    COUNT(*) as archivos_movidos
FROM files 
WHERE deleted_at IS NULL
  AND folder_id IS NULL
  AND updated_at > NOW() - INTERVAL '1 minute';

-- =====================================================
-- 3. CORREGIR USER IDs INCONSISTENTES
-- =====================================================
-- Hacer que archivos tengan el mismo user_id que su carpeta padre

-- Primero, ver qué archivos tienen user_id inconsistente
SELECT 
    'USER_ID_INCONSISTENTE' as problema,
    f.id as file_id,
    f.name as filename,
    f.user_id as file_user_id,
    fold.user_id as folder_user_id,
    fold.name as folder_name,
    'Archivo y carpeta tienen diferentes propietarios' as detalle
FROM files f
JOIN folders fold ON f.folder_id = fold.id
WHERE f.deleted_at IS NULL
  AND fold.deleted_at IS NULL
  AND f.user_id != fold.user_id
ORDER BY f.name;

-- Actualizar user_id de archivos para que coincida con su carpeta
UPDATE files 
SET 
    user_id = fold.user_id,
    storage_path = fold.user_id::text || '/' || 
        CASE 
            WHEN files.folder_id IS NULL THEN 'root'
            ELSE 'folder_' || files.folder_id::text
        END || '/' || files.id::text || '.' || split_part(files.name, '.', array_length(string_to_array(files.name, '.'), 1)),
    updated_at = NOW()
FROM folders fold
WHERE files.folder_id = fold.id
  AND files.deleted_at IS NULL
  AND fold.deleted_at IS NULL
  AND files.user_id != fold.user_id;

-- Verificar el resultado
SELECT 
    'USER_IDS_CORREGIDOS' as resultado,
    COUNT(*) as archivos_corregidos
FROM files f
JOIN folders fold ON f.folder_id = fold.id
WHERE f.deleted_at IS NULL
  AND fold.deleted_at IS NULL
  AND f.user_id = fold.user_id
  AND f.updated_at > NOW() - INTERVAL '1 minute';

-- =====================================================
-- 4. VERIFICACIÓN FINAL DE CONSISTENCIA
-- =====================================================
-- Ejecutar nuevamente el check de consistencia

WITH final_consistency_check AS (
    SELECT 'Storage paths incorrectos' as check_type, COUNT(*) as issues
    FROM files f
    WHERE f.deleted_at IS NULL
      AND (f.storage_path IS NULL OR f.storage_path = '')
    
    UNION ALL
    
    SELECT 'File IDs no coinciden con storage' as check_type, COUNT(*) as issues
    FROM files f
    WHERE f.deleted_at IS NULL
      AND f.storage_path IS NOT NULL
      AND f.storage_path NOT LIKE '%/' || f.id::text || '.%'
    
    UNION ALL
    
    SELECT 'User IDs inconsistentes' as check_type, COUNT(*) as issues
    FROM files f
    JOIN folders fold ON f.folder_id = fold.id
    WHERE f.deleted_at IS NULL
      AND fold.deleted_at IS NULL
      AND f.user_id != fold.user_id
    
    UNION ALL
    
    SELECT 'Referencias rotas' as check_type, COUNT(*) as issues
    FROM files f
    LEFT JOIN folders fold ON f.folder_id = fold.id AND fold.deleted_at IS NULL
    WHERE f.deleted_at IS NULL
      AND f.folder_id IS NOT NULL
      AND fold.id IS NULL
)
SELECT 
    '🎯 CONSISTENCIA FINAL' as titulo,
    check_type,
    issues,
    CASE 
        WHEN issues = 0 THEN '✅ CORREGIDO'
        WHEN issues < 3 THEN '⚠️ MEJORADO'
        ELSE '🚨 PERSISTE'
    END as estado
FROM final_consistency_check
ORDER BY issues DESC;

-- =====================================================
-- 5. RESUMEN DE CORRECCIONES APLICADAS
-- =====================================================
SELECT 
    '📊 RESUMEN DE CORRECCIONES' as titulo,
    'Archivos con storage_path corregido' as accion,
    COUNT(*) as cantidad
FROM files 
WHERE deleted_at IS NULL
  AND updated_at > NOW() - INTERVAL '2 minutes'
  AND storage_path LIKE '%/' || id::text || '.%'

UNION ALL

SELECT 
    '📊 RESUMEN DE CORRECCIONES' as titulo,
    'Archivos movidos a carpeta raíz' as accion,
    COUNT(*) as cantidad
FROM files 
WHERE deleted_at IS NULL
  AND folder_id IS NULL
  AND updated_at > NOW() - INTERVAL '2 minutes'

UNION ALL

SELECT 
    '📊 RESUMEN DE CORRECCIONES' as titulo,
    'User IDs corregidos' as accion,
    COUNT(*) as cantidad
FROM files f
JOIN folders fold ON f.folder_id = fold.id
WHERE f.deleted_at IS NULL
  AND fold.deleted_at IS NULL
  AND f.user_id = fold.user_id
  AND f.updated_at > NOW() - INTERVAL '2 minutes';
