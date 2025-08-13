import type { Role } from './permissions';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  lastLoginAt: string | null;
  isActive: boolean;
  isSuspended: boolean;
  storageUsed: number;
  fileCount: number;
  roles: Role[];
}

export interface AdminUserFilters {
  query?: string;
  role?: string;
  isActive?: boolean;
  isSuspended?: boolean;
  sortBy: 'email' | 'createdAt' | 'lastLoginAt' | 'storageUsed';
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  roleIds: string[];
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  roleIds?: string[];
  isActive?: boolean;
  isSuspended?: boolean;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  suspendedUsers: number;
}

export interface TopUser {
  userId: string;
  email: string;
  storageUsed: number;
  fileCount: number;
}
