/**
 * Hook for file and folder management in admin dashboard
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminFileService } from '../services/admin-file-service';
// Eliminamos importaciones no utilizadas pero mantenemos los tipos que sí se usan
// import type { AdminFile, AdminFolder } from '../types/admin-file';
import type { AdminUser } from '../types/auth'; // Necesario para tipar currentUser

interface UseAdminFilesOptions {
  userId?: string;
  folderId?: string;
  query?: string;
  includeDeleted?: boolean;
  sortBy?: 'name' | 'createdAt' | 'size' | 'updatedAt';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

interface UseAdminFoldersOptions {
  userId?: string;
  parentId?: string | undefined;
  query?: string;
  includeDeleted?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export function useAdminFiles(options: UseAdminFilesOptions = {}) {
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<AdminUser>(['currentAdminUser']);
  
  const {
    userId,
    folderId,
    query,
    includeDeleted = false,
    sortBy = 'createdAt',
    sortDirection = 'desc',
    page = 1,
    pageSize = 20
  } = options;
  
  // Query to fetch files
  const filesQuery = useQuery({
    queryKey: ['adminFiles', { userId, folderId, query, includeDeleted, sortBy, sortDirection, page, pageSize }],
    queryFn: () => adminFileService.getFiles({
      userId,
      folderId,
      query,
      includeDeleted,
      sortBy,
      sortDirection,
      page,
      pageSize
    }),
    placeholderData: (previousData) => previousData
  });
  
  // Mutation to soft delete a file
  const softDeleteFileMutation = useMutation({
    mutationFn: (fileId: string) => {
      if (!currentUser) {
        return Promise.reject(new Error('No current user'));
      }
      
      return adminFileService.softDeleteFile(
        currentUser.id,
        currentUser.email,
        fileId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFiles'] });
    }
  });
  
  // Mutation to restore a file
  const restoreFileMutation = useMutation({
    mutationFn: (fileId: string) => {
      if (!currentUser) {
        return Promise.reject(new Error('No current user'));
      }
      
      return adminFileService.restoreFile(
        currentUser.id,
        currentUser.email,
        fileId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFiles'] });
    }
  });
  
  return {
    files: filesQuery.data?.files || [],
    totalFiles: filesQuery.data?.total || 0,
    isLoading: filesQuery.isPending,
    isError: filesQuery.isError,
    error: filesQuery.error,
    
    softDeleteFile: softDeleteFileMutation.mutateAsync,
    isDeleting: softDeleteFileMutation.isPending,
    deleteError: softDeleteFileMutation.error,
    
    restoreFile: restoreFileMutation.mutateAsync,
    isRestoring: restoreFileMutation.isPending,
    restoreError: restoreFileMutation.error,
    
    // Pagination helpers
    page,
    pageSize,
    totalPages: Math.ceil((filesQuery.data?.total || 0) / pageSize),
    hasNextPage: page < Math.ceil((filesQuery.data?.total || 0) / pageSize),
    hasPreviousPage: page > 1
  };
}

export function useAdminFolders(options: UseAdminFoldersOptions = {}) {
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<AdminUser>(['currentAdminUser']);
  
  const {
    userId,
    parentId = undefined,
    query,
    includeDeleted = false,
    sortBy = 'createdAt',
    sortDirection = 'desc',
    page = 1,
    pageSize = 20
  } = options;
  
  // Query to fetch folders
  const foldersQuery = useQuery({
    queryKey: ['adminFolders', { userId, parentId, query, includeDeleted, sortBy, sortDirection, page, pageSize }],
    queryFn: () => adminFileService.getFolders({
      userId,
      parentId,
      query,
      includeDeleted,
      sortBy,
      sortDirection,
      page,
      pageSize
    }),
    placeholderData: (previousData) => previousData
  });
  
  // Mutation to soft delete a folder
  const softDeleteFolderMutation = useMutation({
    mutationFn: (folderId: string) => {
      if (!currentUser) {
        return Promise.reject(new Error('No current user'));
      }
      
      return adminFileService.softDeleteFolder(
        currentUser.id,
        currentUser.email,
        folderId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFolders'] });
    }
  });
  
  // Mutation to restore a folder
  const restoreFolderMutation = useMutation({
    mutationFn: (folderId: string) => {
      if (!currentUser) {
        return Promise.reject(new Error('No current user'));
      }
      
      return adminFileService.restoreFolder(
        currentUser.id,
        currentUser.email,
        folderId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFolders'] });
    }
  });
  
  return {
    folders: foldersQuery.data?.folders || [],
    totalFolders: foldersQuery.data?.total || 0,
    isLoading: foldersQuery.isPending,
    isError: foldersQuery.isError,
    error: foldersQuery.error,
    
    softDeleteFolder: softDeleteFolderMutation.mutateAsync,
    isDeleting: softDeleteFolderMutation.isPending,
    deleteError: softDeleteFolderMutation.error,
    
    restoreFolder: restoreFolderMutation.mutateAsync,
    isRestoring: restoreFolderMutation.isPending,
    restoreError: restoreFolderMutation.error,
    
    // Pagination helpers
    page,
    pageSize,
    totalPages: Math.ceil((foldersQuery.data?.total || 0) / pageSize),
    hasNextPage: page < Math.ceil((foldersQuery.data?.total || 0) / pageSize),
    hasPreviousPage: page > 1
  };
}

export function useAdminStorageStats() {
  // Query to fetch storage statistics
  const statsQuery = useQuery({
    queryKey: ['adminStorageStats'],
    queryFn: () => adminFileService.getStorageStatistics()
  });
  
  // Query to fetch top users by storage
  const topUsersQuery = useQuery({
    queryKey: ['adminTopUsersByStorage'],
    queryFn: () => adminFileService.getTopUsersByStorage(5)
  });
  
  return {
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isPending,
    isErrorStats: statsQuery.isError,
    errorStats: statsQuery.error,
    
    topUsers: topUsersQuery.data || [],
    isLoadingTopUsers: topUsersQuery.isPending,
    isErrorTopUsers: topUsersQuery.isError,
    errorTopUsers: topUsersQuery.error
  };
}
