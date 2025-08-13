/**
 * Hook for role and permission management in admin dashboard
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Permission } from '../types/auth'; // RoleWithPermissions no se utiliza
import { roleService } from '../services/role-service';
import type { AdminUser } from '../types/auth';

export function useAdminRoles() {
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<AdminUser>(['currentAdminUser']);
  
  // Query to fetch all roles
  const rolesQuery = useQuery({
    queryKey: ['adminRoles'],
    queryFn: () => roleService.getAllRoles()
  });
  
  // Query to fetch all permissions
  const permissionsQuery = useQuery({
    queryKey: ['adminPermissions'],
    queryFn: () => roleService.getAllPermissions()
  });
  
  // Mutation to create a role
  const createRoleMutation = useMutation({
    mutationFn: (roleData: {
      name: string;
      description: string;
      permissionIds: string[];
    }) => {
      if (!currentUser) {
        return Promise.reject(new Error('No current user'));
      }
      
      return roleService.createRole(
        currentUser.id,
        currentUser.email,
        roleData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
    }
  });
  
  // Mutation to update a role
  const updateRoleMutation = useMutation({
    mutationFn: ({ roleId, roleData }: {
      roleId: string;
      roleData: {
        name?: string;
        description?: string;
        permissionIds?: string[];
      };
    }) => {
      if (!currentUser) {
        return Promise.reject(new Error('No current user'));
      }
      
      return roleService.updateRole(
        currentUser.id,
        currentUser.email,
        roleId,
        roleData
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
      queryClient.invalidateQueries({ queryKey: ['adminRole', variables.roleId] });
    }
  });
  
  // Mutation to delete a role
  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => {
      if (!currentUser) {
        return Promise.reject(new Error('No current user'));
      }
      
      return roleService.deleteRole(
        currentUser.id,
        currentUser.email,
        roleId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
    }
  });
  
  // Helper to get permissions by category
  const getPermissionsByCategory = (): Record<string, Permission[]> => {
    const permissions = permissionsQuery.data || [];
    return permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  };
  
  return {
    roles: rolesQuery.data || [],
    isLoadingRoles: rolesQuery.isLoading,
    isErrorRoles: rolesQuery.isError,
    errorRoles: rolesQuery.error,
    
    permissions: permissionsQuery.data || [],
    permissionsByCategory: getPermissionsByCategory(),
    isLoadingPermissions: permissionsQuery.isLoading,
    isErrorPermissions: permissionsQuery.isError,
    errorPermissions: permissionsQuery.error,
    
    createRole: createRoleMutation.mutateAsync,
    isCreatingPending: createRoleMutation.isPending,
    createError: createRoleMutation.error,
    
    updateRole: updateRoleMutation.mutateAsync,
    isUpdatingPending: updateRoleMutation.isPending,
    updateError: updateRoleMutation.error,
    
    deleteRole: deleteRoleMutation.mutateAsync,
    isDeletingPending: deleteRoleMutation.isPending,
    deleteError: deleteRoleMutation.error
  };
}

export function useAdminRole(roleId: string) {
  // Query to fetch a single role
  const roleQuery = useQuery({
    queryKey: ['adminRole', roleId],
    queryFn: () => roleService.getRoleById(roleId),
    enabled: !!roleId
  });
  
  return {
    role: roleQuery.data,
    isLoading: roleQuery.isLoading,
    isError: roleQuery.isError,
    error: roleQuery.error
  };
}
