import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase.js';

// Estas variables de entorno deben configurarse en un archivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Crear el cliente de Supabase con configuración agresiva para evitar bucles infinitos
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false, // DESACTIVAR refresh automático
    persistSession: false,   // NO persistir sesiones problemáticas
    detectSessionInUrl: false,
    flowType: 'pkce'
  },
  global: {
    fetch: (url, options = {}) => {
      // Timeout más agresivo de 5 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Supabase request timeout - aborting');
        controller.abort();
      }, 5000);
      
      return fetch(url, {
        ...options,
        signal: controller.signal
      }).catch(error => {
        clearTimeout(timeoutId);
        console.log('Supabase request failed:', error.message);
        // Rechazar inmediatamente para evitar reintentos
        throw new Error('Supabase service temporarily unavailable');
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    }
  }
});

// Bucket de almacenamiento para archivos
export const STORAGE_BUCKET = 'filesclon';
