import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
// Importamos desde el archivo índice para mejorar la resolución de módulos
import { usePermissions } from '../hooks';

// Importamos el tipo Permission
import type { Permission } from '../types/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: Permission;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  permission 
}) => {
  const auth = useAuth();
  const user = auth.user;
  const isLoadingAuth = auth.loading || false;
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();
  
  // If we're still loading auth or permissions, show a loading state
  if (isLoadingAuth || (permission && isLoadingPermissions)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If a specific permission is required and user doesn't have it, redirect to dashboard
  // or show an access denied page
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/access-denied" replace />;
  }
  
  // If all checks pass, render the protected content
  return <>{children}</>;
};
