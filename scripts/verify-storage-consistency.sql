-- =====================================================
-- SCRIPT DE VERIFICACIÓN DE CONSISTENCIA BD-STORAGE
-- =====================================================
-- Este script verifica la consistencia entre la base de datos
-- y el storage de Supabase para archivos y carpetas.
-- 
-- EJECUTAR EN: Supabase SQL Editor
-- 
-- INSTRUCCIONES:
-- 1. Copia y pega este script completo en el SQL Editor de Supabase
-- 2. Ejecuta cada sección por separado o todo junto
-- 3. Revisa los resultados para identificar problemas de consistencia

-- =====================================================
-- 1. VERIFICAR REFERENCIAS ROTAS (BD → Storage)
-- =====================================================
-- Archivos que existen en BD pero pueden no existir físicamente
-- (Nota: No podemos verificar storage directamente desde SQL)

SELECT 
    'REFERENCIAS_POTENCIALMENTE_ROTAS' as tipo_problema,
    f.id,
    f.name as filename,
    f.storage_path,
    f.user_id,
    f.folder_id,
    f.created_at,
    CASE 
        WHEN f.storage_path IS NULL THEN 'Sin storage_path'
        WHEN f.storage_path = '' THEN 'Storage_path vacío'
        ELSE 'Verificar manualmente en storage'
    END as problema
FROM files f
WHERE f.deleted_at IS NULL
  AND (f.storage_path IS NULL OR f.storage_path = '')
ORDER BY f.created_at DESC;

-- =====================================================
-- 2. VALIDAR FORMATO DE RUTAS DE STORAGE
-- =====================================================
-- Verificar que las rutas sigan el formato: userId/folderId/fileId.extension

SELECT 
    'FORMATO_RUTA_INVALIDO' as tipo_problema,
    f.id,
    f.name as filename,
    f.storage_path,
    f.user_id,
    f.folder_id,
    CASE 
        WHEN f.storage_path NOT LIKE f.user_id || '/%' THEN 'No inicia con user_id'
        WHEN f.storage_path NOT LIKE '%/' || COALESCE(f.folder_id, 'null') || '/%' THEN 'Folder_id no coincide en ruta'
        WHEN f.storage_path NOT LIKE '%.' || split_part(f.name, '.', array_length(string_to_array(f.name, '.'), 1)) THEN 'Extensión no coincide'
        ELSE 'Formato correcto'
    END as problema
FROM files f
WHERE f.deleted_at IS NULL
  AND f.storage_path IS NOT NULL
  AND f.storage_path != ''
  AND (
    f.storage_path NOT LIKE f.user_id || '/%'
    OR (f.folder_id IS NOT NULL AND f.storage_path NOT LIKE '%/' || f.folder_id || '/%')
  )
ORDER BY f.created_at DESC;

-- =====================================================
-- 3. VERIFICAR INTEGRIDAD REFERENCIAL CARPETAS
-- =====================================================
-- Archivos que referencian carpetas inexistentes o eliminadas

SELECT 
    'CARPETA_REFERENCIADA_NO_EXISTE' as tipo_problema,
    f.id,
    f.name as filename,
    f.folder_id as carpeta_inexistente,
    f.user_id,
    f.storage_path,
    f.created_at
FROM files f
LEFT JOIN folders fold ON f.folder_id = fold.id AND fold.deleted_at IS NULL
WHERE f.deleted_at IS NULL
  AND f.folder_id IS NOT NULL
  AND fold.id IS NULL
ORDER BY f.created_at DESC;

-- =====================================================
-- 4. VERIFICAR CARPETAS HUÉRFANAS
-- =====================================================
-- Carpetas que referencian carpetas padre inexistentes

SELECT 
    'CARPETA_PADRE_NO_EXISTE' as tipo_problema,
    child.id,
    child.name as carpeta_nombre,
    child.parent_id as padre_inexistente,
    child.user_id,
    child.created_at
FROM folders child
LEFT JOIN folders parent ON child.parent_id = parent.id AND parent.deleted_at IS NULL
WHERE child.deleted_at IS NULL
  AND child.parent_id IS NOT NULL
  AND parent.id IS NULL
ORDER BY child.created_at DESC;

-- =====================================================
-- 5. VERIFICAR USUARIOS INEXISTENTES
-- =====================================================
-- Archivos y carpetas que referencian usuarios que no existen

-- Archivos con usuarios inexistentes
SELECT 
    'ARCHIVO_USUARIO_NO_EXISTE' as tipo_problema,
    f.id,
    f.name as filename,
    f.user_id as usuario_inexistente,
    f.created_at
FROM files f
LEFT JOIN auth.users u ON f.user_id::uuid = u.id
WHERE f.deleted_at IS NULL
  AND u.id IS NULL
ORDER BY f.created_at DESC;

-- Carpetas con usuarios inexistentes
SELECT 
    'CARPETA_USUARIO_NO_EXISTE' as tipo_problema,
    fold.id,
    fold.name as carpeta_nombre,
    fold.user_id as usuario_inexistente,
    fold.created_at
FROM folders fold
LEFT JOIN auth.users u ON fold.user_id::uuid = u.id
WHERE fold.deleted_at IS NULL
  AND u.id IS NULL
ORDER BY fold.created_at DESC;

-- =====================================================
-- 6. ESTADÍSTICAS GENERALES
-- =====================================================

SELECT 
    'ESTADISTICAS_GENERALES' as tipo,
    'Total archivos activos' as descripcion,
    COUNT(*) as cantidad
FROM files 
WHERE deleted_at IS NULL

UNION ALL

SELECT 
    'ESTADISTICAS_GENERALES' as tipo,
    'Total carpetas activas' as descripcion,
    COUNT(*) as cantidad
FROM folders 
WHERE deleted_at IS NULL

UNION ALL

SELECT 
    'ESTADISTICAS_GENERALES' as tipo,
    'Archivos sin storage_path' as descripcion,
    COUNT(*) as cantidad
FROM files 
WHERE deleted_at IS NULL 
  AND (storage_path IS NULL OR storage_path = '')

UNION ALL

SELECT 
    'ESTADISTICAS_GENERALES' as tipo,
    'Archivos en papelera' as descripcion,
    COUNT(*) as cantidad
FROM files 
WHERE deleted_at IS NOT NULL

UNION ALL

SELECT 
    'ESTADISTICAS_GENERALES' as tipo,
    'Carpetas en papelera' as descripcion,
    COUNT(*) as cantidad
FROM folders 
WHERE deleted_at IS NOT NULL;

-- =====================================================
-- 7. VERIFICAR DUPLICADOS
-- =====================================================
-- Archivos con el mismo nombre en la misma carpeta del mismo usuario

SELECT 
    'ARCHIVOS_DUPLICADOS' as tipo_problema,
    f1.id as archivo1_id,
    f2.id as archivo2_id,
    f1.name as filename,
    f1.folder_id,
    f1.user_id,
    f1.created_at as archivo1_fecha,
    f2.created_at as archivo2_fecha
FROM files f1
JOIN files f2 ON f1.name = f2.name 
    AND f1.folder_id = f2.folder_id 
    AND f1.user_id = f2.user_id
    AND f1.id < f2.id  -- Evitar duplicados en el resultado
WHERE f1.deleted_at IS NULL 
  AND f2.deleted_at IS NULL
ORDER BY f1.name, f1.created_at;

-- Carpetas con el mismo nombre en la misma carpeta padre del mismo usuario
SELECT 
    'CARPETAS_DUPLICADAS' as tipo_problema,
    fold1.id as carpeta1_id,
    fold2.id as carpeta2_id,
    fold1.name as carpeta_nombre,
    fold1.parent_id,
    fold1.user_id,
    fold1.created_at as carpeta1_fecha,
    fold2.created_at as carpeta2_fecha
FROM folders fold1
JOIN folders fold2 ON fold1.name = fold2.name 
    AND COALESCE(fold1.parent_id, 'null') = COALESCE(fold2.parent_id, 'null')
    AND fold1.user_id = fold2.user_id
    AND fold1.id < fold2.id  -- Evitar duplicados en el resultado
WHERE fold1.deleted_at IS NULL 
  AND fold2.deleted_at IS NULL
ORDER BY fold1.name, fold1.created_at;

-- =====================================================
-- 8. VERIFICAR ARCHIVOS HUÉRFANOS EN STORAGE
-- =====================================================
-- Esta función de PostgreSQL puede ayudar a identificar archivos
-- en storage que no tienen registro en la BD (requiere extensión http)

-- NOTA: Para verificar archivos huérfanos en storage, necesitas:
-- 1. Listar todos los archivos en el bucket usando la API de Supabase Storage
-- 2. Comparar con los registros de la tabla files
-- 3. Esto se puede hacer con una función PL/pgSQL o desde el cliente

-- Función para obtener todos los storage_paths de la BD
CREATE OR REPLACE FUNCTION get_all_storage_paths()
RETURNS TABLE(storage_path text) AS $$
BEGIN
    RETURN QUERY
    SELECT f.storage_path
    FROM files f
    WHERE f.deleted_at IS NULL
      AND f.storage_path IS NOT NULL
      AND f.storage_path != '';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. FUNCIÓN DE LIMPIEZA AUTOMÁTICA (USAR CON CUIDADO)
-- =====================================================
-- Esta función puede limpiar referencias rotas automáticamente
-- ¡EJECUTAR SOLO DESPUÉS DE REVISAR LOS RESULTADOS MANUALMENTE!

CREATE OR REPLACE FUNCTION cleanup_broken_references()
RETURNS TABLE(
    action text,
    table_name text,
    record_id uuid,
    details text
) AS $$
BEGIN
    -- Limpiar archivos que referencian carpetas inexistentes
    -- (Mover a carpeta raíz en lugar de eliminar)
    UPDATE files 
    SET folder_id = NULL
    WHERE deleted_at IS NULL
      AND folder_id IS NOT NULL
      AND folder_id NOT IN (
          SELECT id FROM folders WHERE deleted_at IS NULL
      );
    
    GET DIAGNOSTICS action = ROW_COUNT;
    
    RETURN QUERY
    SELECT 
        'FIXED_ORPHANED_FILES'::text,
        'files'::text,
        NULL::uuid,
        format('Moved %s orphaned files to root folder', action);
    
    -- Limpiar carpetas que referencian padres inexistentes
    -- (Mover a carpeta raíz)
    UPDATE folders 
    SET parent_id = NULL
    WHERE deleted_at IS NULL
      AND parent_id IS NOT NULL
      AND parent_id NOT IN (
          SELECT id FROM folders WHERE deleted_at IS NULL
      );
    
    GET DIAGNOSTICS action = ROW_COUNT;
    
    RETURN QUERY
    SELECT 
        'FIXED_ORPHANED_FOLDERS'::text,
        'folders'::text,
        NULL::uuid,
        format('Moved %s orphaned folders to root', action);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. RESUMEN EJECUTIVO
-- =====================================================
-- Consulta final que resume todos los problemas encontrados

WITH problemas_summary AS (
    -- Referencias rotas
    SELECT 'Referencias rotas (sin storage_path)' as problema, COUNT(*) as cantidad
    FROM files f
    WHERE f.deleted_at IS NULL
      AND (f.storage_path IS NULL OR f.storage_path = '')
    
    UNION ALL
    
    -- Archivos que referencian carpetas inexistentes
    SELECT 'Archivos con carpetas inexistentes' as problema, COUNT(*) as cantidad
    FROM files f
    LEFT JOIN folders fold ON f.folder_id = fold.id AND fold.deleted_at IS NULL
    WHERE f.deleted_at IS NULL
      AND f.folder_id IS NOT NULL
      AND fold.id IS NULL
    
    UNION ALL
    
    -- Carpetas con padres inexistentes
    SELECT 'Carpetas con padres inexistentes' as problema, COUNT(*) as cantidad
    FROM folders child
    LEFT JOIN folders parent ON child.parent_id = parent.id AND parent.deleted_at IS NULL
    WHERE child.deleted_at IS NULL
      AND child.parent_id IS NOT NULL
      AND parent.id IS NULL
    
    UNION ALL
    
    -- Archivos duplicados
    SELECT 'Archivos duplicados' as problema, COUNT(*) as cantidad
    FROM (
        SELECT f1.id
        FROM files f1
        JOIN files f2 ON f1.name = f2.name 
            AND COALESCE(f1.folder_id::text, 'null') = COALESCE(f2.folder_id::text, 'null')
            AND f1.user_id = f2.user_id
            AND f1.id < f2.id
        WHERE f1.deleted_at IS NULL 
          AND f2.deleted_at IS NULL
    ) duplicados
    
    UNION ALL
    
    -- Carpetas duplicadas
    SELECT 'Carpetas duplicadas' as problema, COUNT(*) as cantidad
    FROM (
        SELECT fold1.id
        FROM folders fold1
        JOIN folders fold2 ON fold1.name = fold2.name 
            AND COALESCE(fold1.parent_id::text, 'null') = COALESCE(fold2.parent_id::text, 'null')
            AND fold1.user_id = fold2.user_id
            AND fold1.id < fold2.id
        WHERE fold1.deleted_at IS NULL 
          AND fold2.deleted_at IS NULL
    ) duplicados
)
SELECT 
    '🔍 RESUMEN DE CONSISTENCIA' as titulo,
    problema,
    cantidad,
    CASE 
        WHEN cantidad = 0 THEN '✅ OK'
        WHEN cantidad < 5 THEN '⚠️ REVISAR'
        ELSE '🚨 CRÍTICO'
    END as estado
FROM problemas_summary
ORDER BY cantidad DESC;

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================
/*
CÓMO USAR ESTE SCRIPT:

1. EJECUTAR VERIFICACIÓN COMPLETA:
   - Ejecuta todo el script para ver todos los problemas

2. REVISAR PROBLEMAS ESPECÍFICOS:
   - Ejecuta cada sección individualmente para detalles

3. LIMPIAR PROBLEMAS (OPCIONAL):
   - Ejecuta: SELECT * FROM cleanup_broken_references();
   - ¡SOLO después de revisar manualmente los problemas!

4. VERIFICAR ARCHIVOS HUÉRFANOS EN STORAGE:
   - Usa la función get_all_storage_paths()
   - Compara con los archivos reales en tu bucket de Storage
   - Esto requiere acceso a la API de Storage desde fuera de SQL

5. MONITOREO REGULAR:
   - Ejecuta la consulta de "RESUMEN EJECUTIVO" regularmente
   - Programa este script para ejecutarse periódicamente
*/
