// Define los tipos de permisos disponibles en el sistema
export type Permission = 
  // Permisos de usuario
  | 'view_users'
  | 'create_users'
  | 'edit_users'
  | 'delete_users'
  | 'suspend_users'
  
  // Permisos de roles
  | 'view_roles'
  | 'create_roles'
  | 'edit_roles'
  | 'delete_roles'
  
  // Permisos de archivos
  | 'view_all_files'
  | 'download_all_files'
  | 'restore_deleted_files'
  | 'delete_all_files'
  | 'upload_as_user'
  | 'create_folder_as_user'
  
  // Permisos de auditoría
  | 'view_audit_logs'
  | 'export_audit_logs'
  
  // Permisos de analíticas
  | 'view_analytics'
  | 'export_analytics'
  
  // Permisos de configuración
  | 'view_settings'
  | 'edit_settings'
  | 'manage_feature_flags';

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface PermissionGroup {
  name: string;
  permissions: Permission[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: 'Users',
    permissions: ['view_users', 'create_users', 'edit_users', 'delete_users', 'suspend_users']
  },
  {
    name: 'Roles',
    permissions: ['view_roles', 'create_roles', 'edit_roles', 'delete_roles']
  },
  {
    name: 'Files',
    permissions: ['view_all_files', 'download_all_files', 'restore_deleted_files', 'delete_all_files', 'upload_as_user', 'create_folder_as_user']
  },
  {
    name: 'Audit',
    permissions: ['view_audit_logs', 'export_audit_logs']
  },
  {
    name: 'Analytics',
    permissions: ['view_analytics', 'export_analytics']
  },
  {
    name: 'Settings',
    permissions: ['view_settings', 'edit_settings', 'manage_feature_flags']
  }
];

export const DEFAULT_ADMIN_PERMISSIONS: Permission[] = [
  'view_users', 'create_users', 'edit_users', 'delete_users', 'suspend_users',
  'view_roles', 'create_roles', 'edit_roles', 'delete_roles',
  'view_all_files', 'download_all_files', 'restore_deleted_files', 'delete_all_files', 'upload_as_user', 'create_folder_as_user',
  'view_audit_logs', 'export_audit_logs',
  'view_analytics', 'export_analytics',
  'view_settings', 'edit_settings', 'manage_feature_flags'
];

export const DEFAULT_MANAGER_PERMISSIONS: Permission[] = [
  'view_users', 'create_users', 'edit_users',
  'view_roles',
  'view_all_files', 'download_all_files', 'restore_deleted_files',
  'view_audit_logs',
  'view_analytics',
  'view_settings'
];

export const DEFAULT_USER_PERMISSIONS: Permission[] = [];
