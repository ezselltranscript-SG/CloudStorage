/**
 * Audit log types for tracking admin actions
 */

export type AuditActionType = 
  | 'user_create'
  | 'user_update'
  | 'user_delete'
  | 'user_suspend'
  | 'user_activate'
  | 'role_create'
  | 'role_update'
  | 'role_delete'
  | 'permission_update'
  | 'file_admin_delete'
  | 'file_admin_restore'
  | 'folder_admin_delete'
  | 'folder_admin_restore'
  | 'settings_update'
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | string;

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail?: string;
  actionType: AuditActionType;
  targetType: 'user' | 'role' | 'file' | 'folder' | 'setting' | 'system' | string;
  targetId?: string;
  targetName?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilters {
  query?: string; // Text search parameter
  actorId?: string;
  actorIds?: string[]; // Added support for filtering by multiple users
  actionType?: AuditActionType | AuditActionType[];
  targetType?: string;
  targetId?: string;
  fromDate?: string;
  toDate?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// Helper to create a new audit log entry
export const createAuditLogEntry = (
  actorId: string,
  actorEmail: string,
  actionType: AuditActionType,
  targetType: AuditLog['targetType'],
  targetId?: string,
  targetName?: string,
  details?: Record<string, any>
): Omit<AuditLog, 'id' | 'timestamp' | 'ipAddress' | 'userAgent'> => {
  return {
    actorId,
    actorEmail,
    actionType,
    targetType,
    targetId,
    targetName,
    details
  };
};
