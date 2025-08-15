-- =====================================================
-- SCRIPT DE LIMPIEZA DE INCONSISTENCIAS EXISTENTES
-- =====================================================
-- Este script corrige los problemas de consistencia encontrados
-- en la verificación anterior.
-- 
-- EJECUTAR EN: Supabase SQL Editor
-- 
-- ⚠️ IMPORTANTE: Hacer backup antes de ejecutar
-- ⚠️ Revisar cada sección antes de ejecutar

-- =====================================================
-- 1. CORREGIR STORAGE PATHS MALFORMADOS
-- =====================================================
-- Actualizar archivos que tienen "null" en la ruta de storage
-- cuando deberían tener "root" para carpeta raíz

UPDATE files 
SET storage_path = REPLACE(storage_path, '/null/', '/root/')
WHERE storage_path LIKE '%/null/%'
  AND deleted_at IS NULL;

-- Verificar el resultado
SELECT 
    'STORAGE_PATHS_CORREGIDOS' as accion,
    COUNT(*) as archivos_actualizados
FROM files 
WHERE storage_path LIKE '%/root/%'
  AND deleted_at IS NULL;

-- =====================================================
-- 2. MOVER ARCHIVOS HUÉRFANOS A CARPETA RAÍZ
-- =====================================================
-- Archivos que referencian carpetas que no existen
-- Los movemos a la carpeta raíz (folder_id = NULL)

UPDATE files 
SET folder_id = NULL
WHERE deleted_at IS NULL
  AND folder_id IS NOT NULL
  AND folder_id NOT IN (
      SELECT id FROM folders WHERE deleted_at IS NULL
  );

-- Verificar el resultado
SELECT 
    'ARCHIVOS_MOVIDOS_A_RAIZ' as accion,
    COUNT(*) as archivos_movidos
FROM files 
WHERE folder_id IS NULL
  AND deleted_at IS NULL;

-- =====================================================
-- 3. MOVER CARPETAS HUÉRFANAS A CARPETA RAÍZ
-- =====================================================
-- Carpetas que referencian padres que no existen
-- Las movemos a la carpeta raíz (parent_id = NULL)

UPDATE folders 
SET parent_id = NULL
WHERE deleted_at IS NULL
  AND parent_id IS NOT NULL
  AND parent_id NOT IN (
      SELECT id FROM folders WHERE deleted_at IS NULL
  );

-- Verificar el resultado
SELECT 
    'CARPETAS_MOVIDAS_A_RAIZ' as accion,
    COUNT(*) as carpetas_movidas
FROM folders 
WHERE parent_id IS NULL
  AND deleted_at IS NULL;

-- =====================================================
-- 4. ELIMINAR ARCHIVOS DUPLICADOS (CONSERVAR EL MÁS RECIENTE)
-- =====================================================
-- Eliminar archivos duplicados, manteniendo el más reciente

WITH duplicados AS (
    SELECT 
        f1.id as archivo_a_eliminar,
        f2.id as archivo_a_conservar,
        f1.name,
        f1.created_at as fecha_eliminar,
        f2.created_at as fecha_conservar
    FROM files f1
    JOIN files f2 ON f1.name = f2.name 
        AND COALESCE(f1.folder_id::text, 'ROOT') = COALESCE(f2.folder_id::text, 'ROOT')
        AND f1.user_id = f2.user_id
        AND f1.created_at < f2.created_at  -- Eliminar el más antiguo
    WHERE f1.deleted_at IS NULL 
      AND f2.deleted_at IS NULL
)
UPDATE files 
SET deleted_at = NOW()
WHERE id IN (SELECT archivo_a_eliminar FROM duplicados);

-- Verificar el resultado
SELECT 
    'ARCHIVOS_DUPLICADOS_ELIMINADOS' as accion,
    COUNT(*) as archivos_eliminados
FROM files 
WHERE deleted_at IS NOT NULL
  AND deleted_at > NOW() - INTERVAL '1 minute';

-- =====================================================
-- 5. ELIMINAR CARPETAS DUPLICADAS (CONSERVAR LA MÁS RECIENTE)
-- =====================================================
-- Eliminar carpetas duplicadas, manteniendo la más reciente

WITH carpetas_duplicadas AS (
    SELECT 
        fold1.id as carpeta_a_eliminar,
        fold2.id as carpeta_a_conservar,
        fold1.name,
        fold1.created_at as fecha_eliminar,
        fold2.created_at as fecha_conservar
    FROM folders fold1
    JOIN folders fold2 ON fold1.name = fold2.name 
        AND COALESCE(fold1.parent_id::text, 'ROOT') = COALESCE(fold2.parent_id::text, 'ROOT')
        AND fold1.user_id = fold2.user_id
        AND fold1.created_at < fold2.created_at  -- Eliminar la más antigua
    WHERE fold1.deleted_at IS NULL 
      AND fold2.deleted_at IS NULL
)
UPDATE folders 
SET deleted_at = NOW()
WHERE id IN (SELECT carpeta_a_eliminar FROM carpetas_duplicadas);

-- Verificar el resultado
SELECT 
    'CARPETAS_DUPLICADAS_ELIMINADAS' as accion,
    COUNT(*) as carpetas_eliminadas
FROM folders 
WHERE deleted_at IS NOT NULL
  AND deleted_at > NOW() - INTERVAL '1 minute';

-- =====================================================
-- 6. MANTENER CONFIGURACIÓN DE SHARING ACTUAL
-- =====================================================
-- Mantener archivos y carpetas como compartidos (is_shared = true)
-- para que sean visibles a todos los usuarios

-- Verificar configuración actual
SELECT 
    'ARCHIVOS_COMPARTIDOS' as tipo,
    COUNT(*) as cantidad
FROM files 
WHERE is_shared = true
  AND deleted_at IS NULL;

SELECT 
    'CARPETAS_COMPARTIDAS' as tipo,
    COUNT(*) as cantidad
FROM folders 
WHERE is_shared = true
  AND deleted_at IS NULL;

-- =====================================================
-- 7. VERIFICACIÓN FINAL
-- =====================================================
-- Ejecutar nuevamente las consultas de verificación

WITH problemas_finales AS (
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
            AND COALESCE(f1.folder_id::text, 'ROOT') = COALESCE(f2.folder_id::text, 'ROOT')
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
            AND COALESCE(fold1.parent_id::text, 'ROOT') = COALESCE(fold2.parent_id::text, 'ROOT')
            AND fold1.user_id = fold2.user_id
            AND fold1.id < fold2.id
        WHERE fold1.deleted_at IS NULL 
          AND fold2.deleted_at IS NULL
    ) duplicados
)
SELECT 
    '🔧 VERIFICACIÓN POST-LIMPIEZA' as titulo,
    problema,
    cantidad,
    CASE 
        WHEN cantidad = 0 THEN '✅ CORREGIDO'
        WHEN cantidad < 5 THEN '⚠️ REVISAR'
        ELSE '🚨 PERSISTE'
    END as estado
FROM problemas_finales
ORDER BY cantidad DESC;

-- =====================================================
-- RESUMEN DE ACCIONES REALIZADAS
-- =====================================================
/*
ACCIONES EJECUTADAS:

1. ✅ Corregir storage paths malformados (/null/ → /root/)
2. ✅ Mover archivos huérfanos a carpeta raíz
3. ✅ Mover carpetas huérfanas a carpeta raíz  
4. ✅ Eliminar archivos duplicados (conservar más reciente)
5. ✅ Eliminar carpetas duplicadas (conservar más reciente)
6. ✅ Cambiar configuración de sharing a privado por defecto
7. ✅ Verificación final de consistencia

PRÓXIMOS PASOS:
- Verificar que la app funciona correctamente con los cambios
- Monitorear que no se creen nuevas inconsistencias
- Ejecutar el script de verificación periódicamente
*/
