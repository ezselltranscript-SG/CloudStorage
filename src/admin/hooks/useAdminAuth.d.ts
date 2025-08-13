import type { Permission } from './usePermissions';
import { AdminUser } from '../types/auth';

export interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  error: string | null;
  hasPermission: (permission: Permission) => boolean;
  logout: () => Promise<boolean>;
}

export function useAdminAuth(): AdminAuthContextType;
export default useAdminAuth;
