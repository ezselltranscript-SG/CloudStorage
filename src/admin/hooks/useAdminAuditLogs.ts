/**
 * Hook for audit logs in admin dashboard
 */

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { AuditLog, AuditActionType } from '../types/audit';
import { auditService } from '../services/audit-service';
import { userService } from '../services/user-service';
import type { AdminUser } from '../types/admin-user';

interface UseAdminAuditLogsOptions {
  query?: string; // Text search parameter
  userId?: string; // State for filters
  userIds?: string[]; // Added support for filtering by multiple users
  actionType?: AuditActionType | AuditActionType[];
  resourceType?: 'user' | 'role' | 'file' | 'folder' | 'setting' | 'system' | string; // Maps to targetType in AuditLogFilters
  resourceId?: string; // Maps to targetId in AuditLogFilters
  startDate?: string; // Maps to fromDate in AuditLogFilters
  endDate?: string; // Maps to toDate in AuditLogFilters
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export function useAdminAuditLogs(options: UseAdminAuditLogsOptions = {}) {
  const {
    query: initialQuery = '',
    userId: initialUserId = '',
    userIds: initialUserIds = [],
    actionType: initialActionType,
    resourceType: initialResourceType = '',
    resourceId: initialResourceId = '',
    startDate: initialStartDate,
    endDate: initialEndDate,
    page: initialPage = 1,
    pageSize: initialPageSize = 20,
    sortDirection: initialSortDirection = 'desc'
  } = options;
  
  // State for filters
  const [query, setQuery] = useState(initialQuery);
  const [userId, setUserId] = useState(initialUserId);
  const [userIds, setUserIds] = useState<string[]>(initialUserIds);
  const [actionType, setActionType] = useState<AuditActionType | AuditActionType[] | undefined>(initialActionType);
  const [resourceType, setResourceType] = useState(initialResourceType);
  const [resourceId, setResourceId] = useState(initialResourceId);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [sortDirection, setSortDirection] = useState(initialSortDirection);
  
  // State for pagination
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Query to fetch users for filtering
  const usersQuery = useQuery<AdminUser[]>({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const result = await userService.getUsers({});
      return result.users;
    }
  });
  
  // Query to fetch audit logs with proper type
  const logsQuery = useQuery<{ logs: AuditLog[]; total: number }>({
    queryKey: ['adminAuditLogs', { 
      query,
      userId, 
      userIds, 
      actionType, 
      resourceType, 
      resourceId, 
      startDate, 
      endDate, 
      sortDirection, 
      page, 
      pageSize 
    }],
    queryFn: async () => {
      const result = await auditService.getAuditLogs({
        query,
        actorId: userId || undefined,
        actorIds: userIds.length > 0 ? userIds : undefined,
        actionType,
        targetType: resourceType || undefined,
        targetId: resourceId || undefined,
        fromDate: startDate,
        toDate: endDate,
        sortDirection,
        page,
        pageSize
      });
      return result;
    },
    placeholderData: (previousData) => previousData
  });
  
  // Action types based on AuditActionType
  const actionTypes = [
    'user_create', 'user_update', 'user_delete', 'user_suspend', 'user_activate',
    'role_create', 'role_update', 'role_delete',
    'permission_update',
    'file_admin_delete', 'file_admin_restore',
    'folder_admin_delete', 'folder_admin_restore',
    'settings_update',
    'login_success', 'login_failure', 'logout'
  ];
  
  // Resource types based on AuditLog interface
  const resourceTypes = [
    'user', 'role', 'file', 'folder', 'settings', 'system'
  ];
  
  // Create a map of user IDs to emails for easier filtering
  const userMap = usersQuery.data?.reduce((acc, user) => {
    acc[user.id] = user.email;
    return acc;
  }, {} as Record<string, string>) || {};
  
  return {
    // Audit log data
    logs: logsQuery.data?.logs || [],
    totalLogs: logsQuery.data?.total || 0,
    isLoading: logsQuery.isLoading,
    isError: logsQuery.isError,
    error: logsQuery.error,
    
    // Filter options
    query,
    setQuery,
    userId,
    setUserId,
    userIds,
    setUserIds,
    actionType,
    setActionType,
    resourceType,
    setResourceType,
    resourceId,
    setResourceId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sortDirection,
    setSortDirection,
    
    // Filter option lists
    actionTypes,
    isLoadingActionTypes: false,
    resourceTypes,
    isLoadingResourceTypes: false,
    
    // Users for filtering
    users: usersQuery.data || [],
    isLoadingUsers: usersQuery.isLoading,
    userMap,
    
    // Pagination helpers
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages: Math.ceil((logsQuery.data?.total || 0) / pageSize),
    hasNextPage: page < Math.ceil((logsQuery.data?.total || 0) / pageSize),
    hasPreviousPage: page > 1,
    
    // Query operations
    refetch: logsQuery.refetch,
    isRefetching: logsQuery.isRefetching,
    exportLogs: async (filters?: UseAdminAuditLogsOptions) => {
      // Combine current filters with any additional filters provided
      const exportFilters = {
        query: filters?.query || query,
        actorId: filters?.userId || userId || undefined,
        actorIds: filters?.userIds || (userIds.length > 0 ? userIds : undefined),
        actionType: filters?.actionType || actionType,
        targetType: filters?.resourceType || resourceType || undefined,
        targetId: filters?.resourceId || resourceId || undefined,
        fromDate: filters?.startDate || startDate,
        toDate: filters?.endDate || endDate,
        sortDirection: filters?.sortDirection || sortDirection,
        page: 1,
        pageSize: 1000 // Get a larger set of logs for export
      };
      
      try {
        // Get logs with the export filters
        const result = await auditService.getAuditLogs(exportFilters);
        
        if (result.logs.length === 0) {
          console.log('No logs to export');
          return false;
        }
        
        // Generate CSV using the service method
        const csvContent = auditService.exportAuditLogsAsCsv(result.logs);
        
        // Create a blob and download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return true;
      } catch (error) {
        console.error('Error exporting logs:', error);
        return false;
      }
    },
    isExporting: false
  };
}

export function useAdminAuditLog(logId: string) {
  // Query to fetch a single audit log
  const logQuery = useQuery<AuditLog>({
    queryKey: ['adminAuditLog', logId],
    queryFn: async () => {
      // Use the getAuditLogById method directly
      const log = await auditService.getAuditLogById(logId);
      if (!log) throw new Error(`Audit log with ID ${logId} not found`);
      return log;
    },
    enabled: !!logId
  });
  
  return {
    log: logQuery.data,
    isLoading: logQuery.isLoading,
    isError: logQuery.isError,
    error: logQuery.error
  };
}

