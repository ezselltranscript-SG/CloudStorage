import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  FileText, 
  Settings, 
  BarChart3, 
  FolderOpen,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../../lib/utils/cn';
import { useAdminAuth } from '../../context/AdminAuthContext';
import type { Permission } from '../../hooks/usePermissions';

interface AdminSidebarProps {
  isOpen: boolean;
}

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  requiredPermission?: Permission;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  to, 
  icon, 
  label, 
  isOpen,
  requiredPermission 
}) => {
  const { hasPermission } = useAdminAuth();
  
  // If a permission is required and user doesn't have it, don't render the item
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }
  
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "text-slate-700 hover:bg-slate-200",
        !isOpen && "justify-center px-2"
      )}
    >
      <span className="flex items-center justify-center w-5 h-5 mr-3">
        {icon}
      </span>
      {isOpen && <span>{label}</span>}
    </NavLink>
  );
};

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen }) => {
  return (
    <aside 
      className={cn(
        "bg-white border-r border-slate-200 transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-16"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "h-16 flex items-center px-4 border-b border-slate-200",
        !isOpen && "justify-center px-2"
      )}>
        {isOpen ? (
          <h1 className="text-xl font-bold text-primary">Admin Panel</h1>
        ) : (
          <span className="text-xl font-bold text-primary">AP</span>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="p-2 space-y-1">
        <SidebarItem 
          to="/admin" 
          icon={<LayoutDashboard size={18} />} 
          label="Dashboard" 
          isOpen={isOpen}
          requiredPermission="view_dashboard"
        />
        
        <SidebarItem 
          to="/admin/users" 
          icon={<Users size={18} />} 
          label="User Management" 
          isOpen={isOpen}
          requiredPermission="view_users"
        />
        
        <SidebarItem 
          to="/admin/roles" 
          icon={<Shield size={18} />} 
          label="Roles & Permissions" 
          isOpen={isOpen}
          requiredPermission="manage_roles"
        />
        
        <SidebarItem 
          to="/admin/files" 
          icon={<FolderOpen size={18} />} 
          label="Files & Folders" 
          isOpen={isOpen}
          requiredPermission="manage_files"
        />
        
        <SidebarItem 
          to="/admin/analytics" 
          icon={<BarChart3 size={18} />} 
          label="Analytics" 
          isOpen={isOpen}
          requiredPermission="view_analytics"
        />
        
        <SidebarItem 
          to="/admin/audit-logs" 
          icon={<FileText size={18} />} 
          label="Audit Logs" 
          isOpen={isOpen}
          requiredPermission="view_audit_logs"
        />
        
        <SidebarItem 
          to="/admin/settings" 
          icon={<Settings size={18} />} 
          label="Settings" 
          isOpen={isOpen}
          requiredPermission="manage_settings"
        />
      </nav>
      
      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <SidebarItem 
          to="/admin/help" 
          icon={<AlertCircle size={18} />} 
          label="Help & Support" 
          isOpen={isOpen}
        />
      </div>
    </aside>
  );
};
