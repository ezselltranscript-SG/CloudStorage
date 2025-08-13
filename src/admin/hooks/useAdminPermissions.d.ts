import { Permission } from '../types/auth';

export interface AdminPermissionsResult {
  permissions: Permission[];
  permissionsByCategory: Record<string, Permission[]>;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  hasPermission: (permissionId: string) => boolean;
  refetch: () => void;
}

declare const useAdminPermissions: () => AdminPermissionsResult;
export default useAdminPermissions;
