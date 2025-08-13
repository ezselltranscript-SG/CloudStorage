import React from 'react';

export interface ProtectedRouteProps {
  requiredPermission?: string;
  path?: string;
  element?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps>;
export default ProtectedRoute;
