import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import type { Permission } from '../types/permissions';
import type { AdminUser } from '../types/auth';

interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  error: string | null;
  hasPermission: (permission: Permission) => boolean;
  logout: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const { user, loading: isLoadingAuth, signOut } = useAuth();
  const { hasRole, hasPermission, isLoading: isLoadingPermissions, error: permissionsError } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // When both auth and permissions are loaded, we can determine if the user is admin
    if (!isLoadingAuth && !isLoadingPermissions) {
      setLoading(false);
      
      if (permissionsError) {
        setError(permissionsError);
      }
    }
  }, [isLoadingAuth, isLoadingPermissions, permissionsError]);
  
  const logout = async (): Promise<boolean> => {
    try {
      await signOut();
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to logout');
      return false;
    }
  };

  // Convert regular user to admin user
  const adminUser = user ? {
    id: user.id,
    email: user.email || '',
    firstName: user.user_metadata?.firstName || '',
    lastName: user.user_metadata?.lastName || '',
    roles: [user.user_metadata?.role || 'user'],
    isActive: true,
    isSuspended: false,
    createdAt: user.created_at || new Date().toISOString(),
    updatedAt: user.updated_at || new Date().toISOString(),
    storageUsed: user.user_metadata?.storageUsed || 0
  } : null;

  const value = {
    user: adminUser,
    loading,
    isAdmin: hasRole('admin'),
    isManager: hasRole('manager'),
    error,
    hasPermission,
    logout
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  
  return context;
};
