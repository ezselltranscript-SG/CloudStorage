-- Script para verificar la estructura de las tablas

-- Verificar la estructura de organization_settings
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'organization_settings' 
AND table_schema = 'public';

-- Verificar la estructura de feature_flags
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'feature_flags' 
AND table_schema = 'public';

-- Verificar la estructura de quota_settings
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quota_settings' 
AND table_schema = 'public';

-- Verificar la estructura de audit_logs
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
AND table_schema = 'public';

-- Verificar la estructura de users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public';

-- Verificar la estructura de files
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'files' 
AND table_schema = 'public';
