import { useCallback } from 'react';
import { usePermissions } from './usePermissions';
import type { Permission } from '../types/permissions';

/**
 * Hook that provides a function to check if the current user has a specific permission
 * 
 * @example
 * const canManageUsers = useHasPermission('manage_users');
 * 
 * if (canManageUsers) {
 *   // Show user management controls
 * }
 */
export const useHasPermission = (permission?: Permission) => {
  const { hasPermission, isLoading } = usePermissions();
  
  const checkPermission = useCallback((permissionToCheck: Permission) => {
    if (isLoading) {
      return false;
    }
    return hasPermission(permissionToCheck);
  }, [hasPermission, isLoading]);
  
  // If a permission is provided, return whether the user has that permission
  if (permission) {
    return !isLoading && hasPermission(permission);
  }
  
  // Otherwise return the check function
  return checkPermission;
};
