/**
 * Admin authentication and authorization types
 */

export type Role = 'admin' | 'manager' | 'editor' | 'viewer' | string;

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'users' | 'files' | 'folders' | 'system' | 'audit' | string;
}

export interface RoleWithPermissions {
  id: string;
  name: Role;
  description: string;
  isSystem: boolean; // System roles cannot be deleted
  permissions: string[]; // Permission IDs
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  roles: string[]; // Role IDs
  isActive: boolean;
  isSuspended: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  storageUsed: number; // in bytes
}

// Predefined permissions
export const PERMISSIONS = {
  // User management
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  
  // Role management
  MANAGE_ROLES: 'manage_roles',
  VIEW_ROLES: 'view_roles',
  
  // File management (admin)
  MANAGE_ALL_FILES: 'manage_all_files',
  VIEW_ALL_FILES: 'view_all_files',
  
  // Folder management (admin)
  MANAGE_ALL_FOLDERS: 'manage_all_folders',
  VIEW_ALL_FOLDERS: 'view_all_folders',
  
  // Audit logs
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  EXPORT_AUDIT_LOGS: 'export_audit_logs',
  
  // System settings
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_SETTINGS: 'view_settings',
  
  // Analytics
  VIEW_ANALYTICS: 'view_analytics',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionValue = typeof PERMISSIONS[PermissionKey];

// Helper to check if a user has a specific permission
export const hasPermission = (
  user: AdminUser | null | undefined,
  permission: PermissionValue,
  userRoles: RoleWithPermissions[]
): boolean => {
  if (!user) return false;
  
  // Check if any of the user's roles have the required permission
  return userRoles.some(role => 
    user.roles.includes(role.id) && role.permissions.includes(permission)
  );
};

// Helper to check if a user has a specific role
export const hasRole = (
  user: AdminUser | null | undefined,
  role: Role
): boolean => {
  if (!user) return false;
  
  // Check if the user has the specified role
  return user.roles.some(roleId => roleId === role);
};
