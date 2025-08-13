// Script para asignar el rol de administrador a un usuario
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function assignAdminRole() {
  try {
    // 1. Obtener el usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      throw authError;
    }
    
    if (!user) {
      console.error('Error: No hay usuario autenticado');
      process.exit(1);
    }
    
    console.log(`Usuario encontrado: ${user.email} (ID: ${user.id})`);
    
    // 2. Verificar si ya tiene un rol asignado
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (roleCheckError && roleCheckError.code !== 'PGRST116') { // PGRST116 es "no se encontraron resultados"
      throw roleCheckError;
    }
    
    // 3. Insertar o actualizar el rol
    if (existingRole) {
      console.log(`El usuario ya tiene el rol: ${existingRole.role}`);
      
      if (existingRole.role === 'admin') {
        console.log('El usuario ya es administrador. No se requieren cambios.');
        return;
      }
      
      // Actualizar el rol a admin
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', user.id);
      
      if (updateError) {
        throw updateError;
      }
      
      console.log(`Rol actualizado a 'admin' para el usuario ${user.email}`);
    } else {
      // Insertar nuevo rol
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'admin' });
      
      if (insertError) {
        throw insertError;
      }
      
      console.log(`Rol 'admin' asignado al usuario ${user.email}`);
    }
    
    console.log('¡Operación completada con éxito!');
    console.log('Ahora puedes acceder al panel de administración en /admin');
    
  } catch (error) {
    console.error('Error al asignar rol de administrador:', error);
  }
}

// Ejecutar la función
assignAdminRole();
