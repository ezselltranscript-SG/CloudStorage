import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Permission } from '../types/auth';
// Importamos desde el archivo índice para mejorar la resolución de módulos
import { adminService } from '../services';

/**
 * Hook for managing admin permissions
 * Provides functions to fetch, check, and manage permissions in the admin panel
 */
export const useAdminPermissions = () => {
  const [error, setError] = useState<string | null>(null);

  // Fetch all available permissions
  const permissionsQuery = useQuery({
    queryKey: ['adminPermissions'],
    queryFn: async () => {
      try {
        return await adminService.getPermissions();
      } catch (err) {
        setError('Failed to fetch permissions');
        return [];
      }
    }
  });

  // Fetch permissions by category
  const getPermissionsByCategory = () => {
    const permissions = permissionsQuery.data || [];
    return permissions.reduce((acc: Record<string, Permission[]>, permission: Permission) => {
      const category = permission.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  };

  // Check if a permission exists
  const hasPermission = (permissionId: string): boolean => {
    const permissions = permissionsQuery.data || [];
    return permissions.some((p: Permission) => p.id === permissionId);
  };

  return {
    permissions: permissionsQuery.data || [],
    permissionsByCategory: getPermissionsByCategory(),
    isLoading: permissionsQuery.isLoading,
    isError: permissionsQuery.isError,
    error,
    hasPermission,
    refetch: permissionsQuery.refetch
  };
};

export default useAdminPermissions;
