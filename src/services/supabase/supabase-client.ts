import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase.js';

// Estas variables de entorno deben configurarse en un archivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Crear el cliente de Supabase - DESHABILITAR COMPLETAMENTE AUTH AUTOMÁTICO
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,    // NO refresh automático
    persistSession: false,      // NO persistir sesiones
    detectSessionInUrl: false,  // NO detectar en URL
    flowType: 'pkce',
    storage: undefined,         // NO usar localStorage para auth
    storageKey: undefined       // NO key de storage
  },
  global: {
    fetch: (url, options = {}) => {
      const controller = new AbortController();
      
      // Timeout más largo para operaciones de auth (20 segundos)
      const urlString = typeof url === 'string' ? url : url.toString();
      const isAuthOperation = urlString.includes('/auth/v1/');
      const timeout = isAuthOperation ? 20000 : 10000;
      
      const timeoutId = setTimeout(() => {
        console.log(`Supabase request timeout after ${timeout}ms - aborting`);
        controller.abort();
      }, timeout);
      
      return fetch(url, {
        ...options,
        signal: controller.signal
      }).catch(error => {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    }
  }
});

// Bucket de almacenamiento para archivos
export const STORAGE_BUCKET = 'filesclon';
