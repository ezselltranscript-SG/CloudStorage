import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase.js';

// Estas variables de entorno deben configurarse en un archivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Crear el cliente de Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Bucket de almacenamiento para archivos
export const STORAGE_BUCKET = 'filesclon';
