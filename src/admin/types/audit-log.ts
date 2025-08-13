export type AuditLogAction = 
  // Acciones de usuario
  | 'user_login'
  | 'user_logout'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'user_suspended'
  | 'user_activated'
  
  // Acciones de archivos
  | 'file_uploaded'
  | 'file_downloaded'
  | 'file_renamed'
  | 'file_deleted'
  | 'file_restored'
  | 'file_shared'
  | 'file_unshared'
  
  // Acciones de carpetas
  | 'folder_created'
  | 'folder_renamed'
  | 'folder_deleted'
  | 'folder_moved'
  
  // Acciones de roles y permisos
  | 'role_created'
  | 'role_updated'
  | 'role_deleted'
  | 'permission_granted'
  | 'permission_revoked'
  
  // Acciones de configuración
  | 'settings_updated'
  | 'feature_flag_updated';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: AuditLogAction;
  resourceType: 'user' | 'file' | 'folder' | 'role' | 'permission' | 'settings';
  resourceId: string | null;
  resourceName: string | null;
  details: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuditLogFilters {
  userId?: string;
  action?: AuditLogAction;
  resourceType?: 'user' | 'file' | 'folder' | 'role' | 'permission' | 'settings';
  startDate?: string;
  endDate?: string;
  query?: string;
  sortBy: 'timestamp' | 'action' | 'userEmail';
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export function createAuditLogEntry(
  userId: string,
  userEmail: string,
  action: AuditLogAction,
  resourceType: 'user' | 'file' | 'folder' | 'role' | 'permission' | 'settings',
  resourceId: string | null,
  resourceName: string | null,
  details: Record<string, any> = {},
  ipAddress: string | null = null,
  userAgent: string | null = null
): AuditLog {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    userId,
    userEmail,
    action,
    resourceType,
    resourceId,
    resourceName,
    details,
    ipAddress,
    userAgent
  };
}
