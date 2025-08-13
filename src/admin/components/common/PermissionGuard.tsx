import React from 'react';
import type { ReactNode } from 'react';
import type { Permission } from '../../types/permissions';
import { usePermissions } from '../../hooks/usePermissions';

interface PermissionGuardProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 * 
 * @example
 * <PermissionGuard permission="manage_users">
 *   <UserManagementControls />
 * </PermissionGuard>
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback = null
}) => {
  const { hasPermission, isLoading } = usePermissions();
  
  // While permissions are loading, don't render anything
  if (isLoading) {
    return null;
  }
  
  // If user has the required permission, render children
  if (hasPermission(permission)) {
    return <>{children}</>;
  }
  
  // Otherwise render fallback or null
  return <>{fallback}</>;
};
