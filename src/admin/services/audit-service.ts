/**
 * Audit log service for admin dashboard
 */

import { AdminServiceBase } from './admin-service-base';
import type { AuditLog, AuditLogFilters } from '../types/audit';

export class AuditService extends AdminServiceBase {
  /**
   * Get audit logs with pagination and filtering
   */
  async getAuditLogs(filters: AuditLogFilters = {}): Promise<{
    logs: AuditLog[];
    total: number;
  }> {
    try {
      const {
        query,
        actorId,
        actionType,
        targetType,
        targetId,
        fromDate,
        toDate,
        sortDirection = 'desc',
        page = 1,
        pageSize = 20
      } = filters;
      
      // Start building the query
      let query_builder = this.supabase
        .from('audit_logs')
        .select('*', { count: 'exact' });
      
      // Apply filters
      if (query) {
        // If query parameter is provided, search in multiple columns
        query_builder = query_builder.or(
          `actor_email.ilike.%${query}%,target_name.ilike.%${query}%,action_type.ilike.%${query}%`
        );
      }
      
      if (actorId) {
        query_builder = query_builder.eq('actor_id', actorId);
      } else if (filters.actorIds && filters.actorIds.length > 0) {
        query_builder = query_builder.in('actor_id', filters.actorIds);
      }
      
      if (actionType) {
        if (Array.isArray(actionType)) {
          query_builder = query_builder.in('action_type', actionType);
        } else {
          query_builder = query_builder.eq('action_type', actionType);
        }
      }
      
      if (targetType) {
        query_builder = query_builder.eq('target_type', targetType);
      }
      
      if (targetId) {
        query_builder = query_builder.eq('target_id', targetId);
      }
      
      if (fromDate) {
        query_builder = query_builder.gte('timestamp', fromDate);
      }
      
      if (toDate) {
        query_builder = query_builder.lte('timestamp', toDate);
      }
      
      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query_builder = query_builder
        .order('timestamp', { ascending: sortDirection === 'asc' })
        .range(from, to);
      
      // Execute the query
      const { data, count, error } = await query_builder;
      
      if (error) throw error;
      
      // Transform to AuditLog type
      const logs: AuditLog[] = (data || []).map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        actorId: log.actor_id,
        actorEmail: log.actor_email,
        actionType: log.action_type,
        targetType: log.target_type,
        targetId: log.target_id,
        targetName: log.target_name,
        details: log.details,
        ipAddress: log.ip_address,
        userAgent: log.user_agent
      }));
      
      return {
        logs,
        total: count || logs.length
      };
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return { logs: [], total: 0 };
    }
  }
  
  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(userId: string, page = 1, pageSize = 10): Promise<{
    logs: AuditLog[];
    total: number;
  }> {
    return this.getAuditLogs({
      actorId: userId,
      page,
      pageSize
    });
  }
  
  /**
   * Get recent admin actions for dashboard
   */
  async getRecentAdminActions(limit = 5): Promise<AuditLog[]> {
    try {
      const { data, error } = await this.supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      // Transform to AuditLog type
      return (data || []).map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        actorId: log.actor_id,
        actorEmail: log.actor_email,
        actionType: log.action_type,
        targetType: log.target_type,
        targetId: log.target_id,
        targetName: log.target_name,
        details: log.details,
        ipAddress: log.ip_address,
        userAgent: log.user_agent
      }));
    } catch (error) {
      console.error('Failed to get recent admin actions:', error);
      return [];
    }
  }
  
  /**
   * Get a single audit log by ID
   */
  async getAuditLogById(id: string): Promise<AuditLog | null> {
    try {
      const { data, error } = await this.supabase
        .from('audit_logs')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!data) return null;
      
      // Transform to AuditLog type
      return {
        id: data.id,
        timestamp: data.timestamp,
        actorId: data.actor_id,
        actorEmail: data.actor_email,
        actionType: data.action_type,
        targetType: data.target_type,
        targetId: data.target_id,
        targetName: data.target_name,
        details: data.details,
        ipAddress: data.ip_address,
        userAgent: data.user_agent
      };
    } catch (error) {
      console.error('Failed to get audit log by ID:', error);
      return null;
    }
  }
  
  /**
   * Export audit logs as CSV
   */
  exportAuditLogsAsCsv(logs: AuditLog[]): string {
    // Headers
    const headers = [
      'ID',
      'Timestamp',
      'Actor ID',
      'Actor Email',
      'Action Type',
      'Target Type',
      'Target ID',
      'Target Name',
      'Details',
      'IP Address',
      'User Agent'
    ];
    
    // Rows
    const rows = logs.map(log => [
      log.id,
      log.timestamp,
      log.actorId,
      log.actorEmail || '',
      log.actionType,
      log.targetType,
      log.targetId || '',
      log.targetName || '',
      log.details ? JSON.stringify(log.details) : '',
      log.ipAddress || '',
      log.userAgent || ''
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    return csvContent;
  }
}

// Export a singleton instance
export const auditService = new AuditService();
