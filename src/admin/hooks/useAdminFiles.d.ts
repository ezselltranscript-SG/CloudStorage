import { UseMutateAsyncFunction } from '@tanstack/react-query';

// Definiendo los tipos que se importan en el hook
export interface AdminFile {
  id: string;
  name: string;
  size: number;
  type: string;
  path: string;
  userId: string;
  folderId: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  url?: string;
  thumbnailUrl?: string;
}

export interface AdminFolder {
  id: string;
  name: string;
  path: string;
  userId: string;
  parentId: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

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

export interface AdminFilesResult {
  files: AdminFile[];
  folders: AdminFolder[];
  totalItems: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  deleteFile: UseMutateAsyncFunction<{ success: boolean; error: string | null; }, Error, string, unknown>;
  restoreFile: UseMutateAsyncFunction<{ success: boolean; error: string | null; }, Error, string, unknown>;
  deleteFolder: UseMutateAsyncFunction<{ success: boolean; error: string | null; }, Error, string, unknown>;
  restoreFolder: UseMutateAsyncFunction<{ success: boolean; error: string | null; }, Error, string, unknown>;
  isDeleting: boolean;
  isRestoring: boolean;
  deleteError: Error | null;
  restoreError: Error | null;
  refetch: () => void;
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function useAdminFiles(options?: UseAdminFilesOptions): AdminFilesResult;
