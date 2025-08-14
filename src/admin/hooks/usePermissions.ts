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
        
        // Obtiene relación básica: user_roles.role_id para el usuario
        const { data: ur, error: urError } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (urError) {
          console.error('Error obteniendo user_roles:', urError);
          setUserRole('user');
          return;
        }

        if (!ur || !ur.role_id) {
          // Sin asignación explícita, degrada a 'user'
          setUserRole('user');
          return;
        }

        // Resuelve el nombre del rol en la tabla roles
        const { data: roleRow, error: roleErr } = await supabase
          .from('roles')
          .select('name')
          .eq('id', ur.role_id)
          .maybeSingle();

        if (roleErr || !roleRow) {
          console.error('No se pudo resolver el nombre del rol:', roleErr);
          setUserRole('user');
          return;
        }

        const roleName = (roleRow.name || '').toLowerCase();
        if (roleName === 'admin' || roleName === 'manager' || roleName === 'user') {
          setUserRole(roleName as Role);
        } else {
          // Cualquier otro rol se mapea a permisos mínimos por defecto
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
    const perms = rolePermissions[userRole];
    return Array.isArray(perms) && perms.includes(permission);
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
