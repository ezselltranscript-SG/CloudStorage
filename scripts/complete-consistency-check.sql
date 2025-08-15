-- VERIFICACIÓN EXHAUSTIVA DE CONSISTENCIA BD-STORAGE (CORREGIDA)
-- Ejecutar en Supabase SQL Editor

-- =====================================================
-- 1. VERIFICAR QUE STORAGE_PATH COINCIDA CON ESTRUCTURA REAL
-- =====================================================
WITH folder_hierarchy AS (
    WITH RECURSIVE folder_paths AS (
        -- Carpetas raíz
        SELECT 
            id,
            name,
            parent_id,
            user_id,
            name as full_path,
            0 as level
        FROM folders 
        WHERE parent_id IS NULL AND deleted_at IS NULL
        
        UNION ALL
        
        -- Carpetas anidadas
        SELECT 
            f.id,
            f.name,
            f.parent_id,
            f.user_id,
            fp.full_path || '/' || f.name as full_path,
            fp.level + 1
        FROM folders f
        JOIN folder_paths fp ON f.parent_id = fp.id
        WHERE f.deleted_at IS NULL
    )
    SELECT * FROM folder_paths
),
expected_storage_paths AS (
    SELECT 
        f.id as file_id,
        f.name as filename,
        f.folder_id,
        f.storage_path as current_path,
        f.user_id,
        CASE 
            WHEN f.folder_id IS NULL THEN 
                f.user_id::text || '/root/' || f.id::text || '.' || split_part(f.name, '.', array_length(string_to_array(f.name, '.'), 1))
            ELSE 
                f.user_id::text || '/' || fh.full_path || '/' || f.id::text || '.' || split_part(f.name, '.', array_length(string_to_array(f.name, '.'), 1))
        END as expected_path
    FROM files f
    LEFT JOIN folder_hierarchy fh ON f.folder_id = fh.id
    WHERE f.deleted_at IS NULL
)
SELECT 
    'STORAGE_PATH_MISMATCH' as problema,
    file_id,
    filename,
    folder_id,
    current_path,
    expected_path,
    'Path no coincide con jerarquía de carpetas' as detalle
FROM expected_storage_paths
WHERE current_path != expected_path
ORDER BY filename;

-- =====================================================
-- 2. VERIFICAR QUE FILE IDs COINCIDAN CON NOMBRES EN STORAGE
-- =====================================================
SELECT 
    'FILE_ID_MISMATCH' as problema,
    f.id as file_id,
    f.name as filename,
    f.storage_path,
    'ID no está en el nombre del archivo físico' as detalle
FROM files f
WHERE f.deleted_at IS NULL
  AND f.storage_path IS NOT NULL
  AND f.storage_path NOT LIKE '%/' || f.id::text || '.%'
ORDER BY f.name;

-- =====================================================
-- 3. VERIFICAR JERARQUÍA DE CARPETAS COMPLETA
-- =====================================================
WITH RECURSIVE folder_check AS (
    SELECT 
        id,
        name,
        parent_id,
        user_id,
        ARRAY[id] as path,
        0 as depth
    FROM folders 
    WHERE deleted_at IS NULL
    
    UNION ALL
    
    SELECT 
        f.id,
        f.name,
        f.parent_id,
        f.user_id,
        fc.path || f.id,
        fc.depth + 1
    FROM folders f
    JOIN folder_check fc ON f.parent_id = fc.id
    WHERE f.deleted_at IS NULL
      AND f.id != ALL(fc.path)
      AND fc.depth < 50
)
SELECT 
    'FOLDER_HIERARCHY_ISSUES' as problema,
    COUNT(*) as folders_with_issues,
    'Posibles ciclos o jerarquía muy profunda' as detalle
FROM folders f
WHERE f.deleted_at IS NULL
  AND f.id NOT IN (SELECT id FROM folder_check);

-- =====================================================
-- 4. VERIFICAR CONSISTENCIA DE USER_IDs
-- =====================================================
SELECT 
    'USER_ID_MISMATCH' as problema,
    f.id as file_id,
    f.name as filename,
    f.user_id as file_user_id,
    fold.user_id as folder_user_id,
    fold.name as folder_name,
    'Archivo y carpeta tienen diferentes user_id' as detalle
FROM files f
JOIN folders fold ON f.folder_id = fold.id
WHERE f.deleted_at IS NULL
  AND fold.deleted_at IS NULL
  AND f.user_id != fold.user_id
ORDER BY f.name;

-- =====================================================
-- 5. VERIFICAR ESTRUCTURA DE STORAGE PATHS
-- =====================================================
SELECT 
    'INVALID_STORAGE_FORMAT' as problema,
    f.id,
    f.name,
    f.storage_path,
    f.user_id,
    f.folder_id,
    CASE 
        WHEN f.storage_path !~ '^[^/]+/[^/]+/[^/]+\.[^/]+$' THEN 'Formato general inválido'
        WHEN split_part(f.storage_path, '/', 1) != f.user_id::text THEN 'User ID no coincide'
        WHEN split_part(f.storage_path, '/', 3) !~ ('^' || f.id::text || '\.') THEN 'File ID no está en el nombre'
        ELSE 'Otro problema de formato'
    END as detalle
FROM files f
WHERE f.deleted_at IS NULL
  AND f.storage_path IS NOT NULL
  AND (
    f.storage_path !~ '^[^/]+/[^/]+/[^/]+\.[^/]+$'
    OR split_part(f.storage_path, '/', 1) != f.user_id::text
    OR split_part(f.storage_path, '/', 3) !~ ('^' || f.id::text || '\.')
  )
ORDER BY f.name;

-- =====================================================
-- 6. RESUMEN DE CONSISTENCIA COMPLETA
-- =====================================================
WITH consistency_check AS (
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
    '🔍 CONSISTENCIA BD-STORAGE' as titulo,
    check_type,
    issues,
    CASE 
        WHEN issues = 0 THEN '✅ CONSISTENTE'
        WHEN issues < 5 THEN '⚠️ REVISAR'
        ELSE '🚨 CRÍTICO'
    END as estado
FROM consistency_check
ORDER BY issues DESC;
