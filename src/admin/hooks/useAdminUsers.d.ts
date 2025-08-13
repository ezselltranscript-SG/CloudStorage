import { UseMutateAsyncFunction } from '@tanstack/react-query';
import { AdminUser } from '../types/auth';

interface UseAdminUsersOptions {
  query?: string;
  role?: string;
  isActive?: boolean;
  isSuspended?: boolean;
  sortBy?: 'email' | 'createdAt' | 'lastLoginAt' | 'storageUsed';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface AdminUsersResult {
  users: AdminUser[];
  totalUsers: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  createUser: UseMutateAsyncFunction<{ user: AdminUser | null; error: string | null; }, Error, { email: string; password: string; roleId?: string; }, unknown>;
  updateUser: UseMutateAsyncFunction<{ success: boolean; error: string | null; }, Error, { userId: string; userData: Partial<AdminUser>; }, unknown>;
  deleteUser: UseMutateAsyncFunction<{ success: boolean; error: string | null; }, Error, string, unknown>;
  toggleUserStatus: UseMutateAsyncFunction<{ success: boolean; error: string | null; }, Error, string, unknown>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isTogglingStatus: boolean; // Añadiendo esta propiedad para resolver el error
  createError: Error | null;
  updateError: Error | null;
  deleteError: Error | null;
  toggleStatusError: Error | null;
  refetch: () => void;
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function useAdminUsers(options?: UseAdminUsersOptions): AdminUsersResult;
