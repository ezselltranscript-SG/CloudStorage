import React, { useState } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { StateDisplay } from '../common/StateDisplay';
import { AdminTooltip } from '../common/AdminTooltip';
import { useAdminToast } from '../../context/AdminToastContext';
import type { Role } from '../../hooks/usePermissions';
import type { Permission } from '../../types/permissions';

interface PermissionGroup {
  name: string;
  permissions: Permission[];
  description: string;
}

interface RolePermissionMatrixProps {
  roles: Role[];
  permissionGroups: PermissionGroup[];
  rolePermissions: Record<Role, Permission[]>;
  isLoading: boolean;
  isError: boolean;
  onPermissionToggle: (role: Role, permission: Permission) => Promise<void>;
}

/**
 * Component that displays a matrix of roles and permissions with toggleable cells
 */
export const RolePermissionMatrix: React.FC<RolePermissionMatrixProps> = ({
  roles,
  permissionGroups,
  rolePermissions,
  isLoading,
  isError,
  onPermissionToggle
}) => {
  const { showToast } = useAdminToast();
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
  
  // Check if a role has a specific permission
  const hasPermission = (role: Role, permission: Permission): boolean => {
    return rolePermissions[role]?.includes(permission) || false;
  };
  
  // Handle permission toggle
  const handleToggle = async (role: Role, permission: Permission) => {
    const key = `${role}:${permission}`;
    
    // Set pending state
    setPendingChanges(prev => ({ ...prev, [key]: true }));
    
    try {
      await onPermissionToggle(role, permission);
      showToast('success', `Permission updated for ${role} role`);
    } catch (error) {
      showToast('error', `Failed to update permission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Clear pending state
      setPendingChanges(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    }
  };
  
  return (
    <StateDisplay
      isLoading={isLoading}
      isError={isError}
      loadingMessage="Loading role permissions..."
      errorMessage="Failed to load role permissions. Please try again."
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-md">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Permission
              </th>
              {roles.map(role => (
                <th 
                  key={role} 
                  scope="col" 
                  className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {permissionGroups.map(group => (
              <React.Fragment key={group.name}>
                {/* Group header */}
                <tr className="bg-slate-100">
                  <td 
                    colSpan={roles.length + 1} 
                    className="px-6 py-2 text-sm font-medium text-slate-700"
                  >
                    <div className="flex items-center">
                      <span>{group.name}</span>
                      <AdminTooltip content={group.description} position="right">
                        <span className="ml-2 text-slate-400 cursor-help">
                          <AlertCircle className="h-4 w-4" />
                        </span>
                      </AdminTooltip>
                    </div>
                  </td>
                </tr>
                
                {/* Permissions in this group */}
                {group.permissions.map(permission => (
                  <tr key={permission} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {permission.replace(/_/g, ' ')}
                    </td>
                    
                    {roles.map(role => {
                      const isChecked = hasPermission(role, permission);
                      const isPending = pendingChanges[`${role}:${permission}`];
                      
                      return (
                        <td key={`${role}-${permission}`} className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            type="button"
                            className={`
                              inline-flex items-center justify-center w-6 h-6 rounded-md
                              ${isChecked 
                                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}
                              transition-colors duration-200
                              ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                            onClick={() => !isPending && handleToggle(role, permission)}
                            disabled={isPending}
                            aria-label={`${isChecked ? 'Remove' : 'Add'} ${permission} permission from ${role} role`}
                          >
                            {isPending ? (
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : isChecked ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </StateDisplay>
  );
};
