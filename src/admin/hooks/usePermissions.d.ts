import { ReactNode } from 'react';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface PermissionsContextType {
  hasPermission: (permissionId: string) => boolean;
  permissions: Permission[];
  loading: boolean;
  error: Error | null;
}

declare const usePermissions: () => PermissionsContextType;
export default usePermissions;
