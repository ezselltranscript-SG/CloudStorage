/**
 * Base admin service that extends the Supabase client
 * Provides common functionality for all admin services
 */

import { supabase } from '../../services/supabase/supabase-client';
import type { AdminUser } from '../types/admin-user';
import type { AuditLog } from '../types/audit';
import { createAuditLogEntry } from '../utils/audit-utils';

export class AdminServiceBase {
  protected supabase = supabase;
  
  /**
   * Creates an audit log entry
   */
  protected async createAuditLog(
    actorId: string,
    actorEmail: string,
    actionType: AuditLog['actionType'],
    targetType: AuditLog['targetType'],
    targetId?: string,
    targetName?: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const auditEntry = createAuditLogEntry(
        actorId,
        actorEmail,
        actionType,
        targetType,
        targetId,
        targetName,
        details
      );
      
      // Add timestamp on the server
      await this.supabase
        .from('audit_logs')
        .insert({
          ...auditEntry,
          timestamp: new Date().toISOString(),
          ip_address: 'client-side', // This would be replaced by server middleware
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logs should not break functionality
    }
  }
  
  /**
   * Gets the current admin user
   */
  protected async getCurrentUser(): Promise<AdminUser | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) return null;
      
      // Get additional user data from the users table
      const { data: userData } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
      if (!userData) return null;
      
      // Get user roles
      const { data: userRoles } = await this.supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', user.id);
        
      return {
        id: user.id,
        email: user.email || '',
        firstName: userData.first_name,
        lastName: userData.last_name,
        fullName: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
        avatarUrl: userData.avatar_url,
        roles: userRoles?.map(ur => ur.role_id) || [],
        isActive: userData.is_active || true,
        isSuspended: userData.is_suspended || false,
        lastLoginAt: userData.last_login_at,
        createdAt: userData.created_at || user.created_at,
        updatedAt: userData.updated_at,
        storageUsed: userData.storage_used || 0,
        fileCount: userData.file_count || 0
      };
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }
}
