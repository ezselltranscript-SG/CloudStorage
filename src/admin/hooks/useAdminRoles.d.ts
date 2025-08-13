import { Permission } from '../types/auth';

export interface RoleWithPermissions {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  userCount?: number; // Agregando esta propiedad para resolver los errores de tipo
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminRolesResult {
  roles: RoleWithPermissions[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  createRole: (roleData: { name: string; description?: string; permissionIds?: string[] }) => Promise<{ role: RoleWithPermissions | null; error: string | null }>;
  updateRole: (params: { roleId: string; roleData: { name?: string; description?: string; permissionIds?: string[] } }) => Promise<{ success: boolean; error: string | null }>;
  deleteRole: (roleId: string) => Promise<{ success: boolean; error: string | null }>;
  refetch: () => void;
}

export function useAdminRoles(): AdminRolesResult;
