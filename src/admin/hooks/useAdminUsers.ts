/**
 * Hook for user management in admin dashboard
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminUser } from '../types/auth';
import { userService } from '../services/user-service';

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

export function useAdminUsers(options: UseAdminUsersOptions = {}) {
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<AdminUser>(['currentAdminUser']);
  
  const {
    query,
    role,
    isActive,
    isSuspended,
    sortBy = 'createdAt',
    sortDirection = 'desc',
    page = 1,
    pageSize = 10
  } = options;
  
  // Query to fetch users
  const usersQuery = useQuery({
    queryKey: ['adminUsers', { query, role, isActive, isSuspended, sortBy, sortDirection, page, pageSize }],
    queryFn: () => userService.getUsers({
      query,
      role,
      isActive,
      isSuspended,
      sortBy,
      sortDirection,
      page,
      pageSize
    }),
    placeholderData: (previousData) => previousData
  });
  
  // Mutation to create a user
  const createUserMutation = useMutation({
    mutationFn: (userData: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
      roleIds: string[];
    }) => {
      if (!currentUser) {
        return Promise.reject(new Error('No current user'));
      }
      
      return userService.createUser(
        currentUser.id,
        currentUser.email,
        userData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    }
  });
  
  // Mutation to update a user
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, userData }: {
      userId: string;
      userData: {
        firstName?: string;
        lastName?: string;
        roleIds?: string[];
        isActive?: boolean;
        isSuspended?: boolean;
      };
    }) => {
      if (!currentUser) {
        return Promise.reject(new Error('No current user'));
      }
      
      return userService.updateUser(
        currentUser.id,
        currentUser.email,
        userId,
        userData
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminUser', variables.userId] });
    }
  });
  
  // Mutation to delete a user
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => {
      if (!currentUser) {
        return Promise.reject(new Error('No current user'));
      }
      
      return userService.deleteUser(
        currentUser.id,
        currentUser.email,
        userId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    }
  });
  
  // Mutation to suspend/activate a user
  const toggleUserSuspensionMutation = useMutation({
    mutationFn: ({ userId, suspend }: { userId: string; suspend: boolean }) => {
      if (!currentUser) {
        return Promise.reject(new Error('No current user'));
      }
      
      return userService.toggleUserSuspension(
        currentUser.id,
        currentUser.email,
        userId,
        suspend
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminUser', variables.userId] });
    }
  });
  
  return {
    users: usersQuery.data?.users || [],
    totalUsers: usersQuery.data?.total || 0,
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    error: usersQuery.error,
    
    createUser: createUserMutation.mutateAsync,
    isCreatingPending: createUserMutation.isPending,
    createError: createUserMutation.error,
    
    updateUser: updateUserMutation.mutateAsync,
    isUpdatingPending: updateUserMutation.isPending,
    updateError: updateUserMutation.error,
    
    deleteUser: deleteUserMutation.mutateAsync,
    isDeletingPending: deleteUserMutation.isPending,
    deleteError: deleteUserMutation.error,
    
    toggleUserSuspension: toggleUserSuspensionMutation.mutateAsync,
    isTogglingPending: toggleUserSuspensionMutation.isPending,
    toggleStatusError: toggleUserSuspensionMutation.error,
    
    // Pagination helpers
    page,
    pageSize,
    totalPages: Math.ceil((usersQuery.data?.total || 0) / pageSize),
    hasNextPage: page < Math.ceil((usersQuery.data?.total || 0) / pageSize),
    hasPreviousPage: page > 1
  };
}

export function useAdminUser(userId: string) {
  // const queryClient = useQueryClient(); // Comentado porque no se utiliza
  
  // Query to fetch a single user
  const userQuery = useQuery({
    queryKey: ['adminUser', userId],
    queryFn: () => userService.getUserById(userId),
    enabled: !!userId
  });
  
  // Query to fetch user storage stats
  const storageStatsQuery = useQuery({
    queryKey: ['adminUserStorage', userId],
    queryFn: () => userService.getUserStorageStats(userId),
    enabled: !!userId
  });
  
  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    isError: userQuery.isError,
    error: userQuery.error,
    
    storageStats: storageStatsQuery.data,
    isLoadingStats: storageStatsQuery.isLoading,
    isErrorStats: storageStatsQuery.isError,
    errorStats: storageStatsQuery.error
  };
}
