import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase/supabase-client';
import type { Permission } from '../types/permissions';

// Define role types
export type Role = 'admin' | 'manager' | 'user';

// Define role-permission mapping
const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    'view_dashboard',
    'view_users',
    'create_users',
    'edit_users',
    'delete_users',
    'suspend_users',
    'manage_users',
    'view_roles',
    'create_roles',
    'edit_roles',
    'delete_roles',
    'manage_roles',
    'view_all_files',
    'download_all_files',
    'restore_deleted_files',
    'delete_all_files',
    'upload_as_user',
    'create_folder_as_user',
    'manage_files',
    'view_audit_logs',
    'export_audit_logs',
    'view_analytics',
    'export_analytics',
    'manage_settings',
    'view_settings',
    'edit_settings'
  ],
  manager: [
    'view_dashboard',
    'view_users',
    'view_roles',
    'view_all_files',
    'download_all_files',
    'upload_as_user',
    'create_folder_as_user',
    'view_audit_logs',
    'view_analytics',
    'view_settings'
  ],
  user: [
    'view_dashboard',
    'view_all_files',
    'download_all_files',
    'upload_as_user',
    'create_folder_as_user'
  ]
};

export const usePermissions = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Intenta obtener el rol del usuario directamente
        let { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        // Si hay un error o no hay datos, intentamos una consulta alternativa
        if (error || !data) {
          console.log('Primer intento fallido, probando consulta alternativa');
          
          // Intenta obtener cualquier campo de la tabla user_roles
          const response = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
            
          data = response.data;
          error = response.error;
          
          if (error) {
            console.error('Error en consulta alternativa:', error);
          } else if (data) {
            console.log('Datos obtenidos en consulta alternativa:', data);
          }
        }
        
        // Si tenemos datos, intentamos extraer el rol
        if (data) {
          // Verificamos si existe la propiedad 'role'
          if ('role' in data && typeof data.role === 'string') {
            setUserRole(data.role as Role);
          } 
          // Si no existe 'role' pero existe 'role_id', usamos ese
          else if ('role_id' in data && typeof data.role_id === 'string') {
            setUserRole(data.role_id as Role);
          }
          // Si no hay ninguno de los dos, usamos el rol por defecto
          else {
            console.warn('No se encontró columna role o role_id en los datos:', data);
            setUserRole('user');
          }
        } else {
          // Si no hay datos, asignamos el rol por defecto
          console.warn('No se encontraron datos de rol para el usuario:', user.id);
          setUserRole('user');
        }
      } catch (err) {
        console.error('Error crítico al obtener el rol del usuario:', err);
        setError('Failed to fetch user permissions');
        // Default to user role if there's an error
        setUserRole('user');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserRole();
  }, [user]);
  
  // Check if user has a specific permission
  const hasPermission = (permission: Permission): boolean => {
    if (!userRole) return false;
    
    return rolePermissions[userRole].includes(permission);
  };
  
  // Get all permissions for the current user
  const getUserPermissions = (): Permission[] => {
    if (!userRole) return [];
    
    return rolePermissions[userRole];
  };
  
  // Check if user has a specific role
  const hasRole = (role: Role): boolean => {
    return userRole === role;
  };
  
  return {
    userRole,
    hasPermission,
    getUserPermissions,
    hasRole,
    isLoading,
    error
  };
};
