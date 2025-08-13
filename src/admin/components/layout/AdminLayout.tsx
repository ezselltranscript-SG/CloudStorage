import React, { useState } from 'react';
import type { ReactNode } from 'react';
// Import from index.ts to ensure proper module resolution
import { AdminSidebar } from '../layout';
import { AdminTopbar } from '../layout';
// Use relative path with explicit file extension
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { Navigate } from 'react-router-dom';
import type { Permission } from '../../hooks/usePermissions';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  requirePermission?: Permission;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title = 'Dashboard',
  requirePermission
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, loading, hasPermission } = useAdminAuth();
  
  // Check if user is authenticated and has required permission
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }
  
  if (requirePermission && !hasPermission(requirePermission)) {
    return <Navigate to="/admin/unauthorized" replace />;
  }
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} />
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <AdminTopbar 
          title={title} 
          onMenuClick={toggleSidebar} 
          user={user}
        />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
