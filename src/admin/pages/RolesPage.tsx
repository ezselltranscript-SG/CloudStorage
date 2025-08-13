import React, { useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { useAdminRoles } from '../hooks/useAdminRoles';
// Importamos desde el archivo índice para mejorar la resolución de módulos
import { useAdminPermissions } from '../hooks';
import type { Permission } from '../types/auth';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X,
  Loader2,
  Save,
  AlertTriangle
} from 'lucide-react';

export const RolesPage: React.FC = () => {
  // State for editing roles and permissions
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [showNewRoleForm, setShowNewRoleForm] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({});
  
  // Get roles and permissions data
  const { 
    roles, 
    isLoadingRoles, 
    isErrorRoles,
    createRole,
    updateRole,
    deleteRole,
    isCreatingPending,
    isUpdatingPending,
    isDeletingPending
  } = useAdminRoles();
  
  const { 
    permissions, 
    isLoading: isLoadingPermissions, 
    isError: isErrorPermissions 
  } = useAdminPermissions();
  
  // Group permissions by category for better organization
  const permissionsByCategory = permissions.reduce((acc: Record<string, Permission[]>, permission: Permission) => {
    const category = permission.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, typeof permissions>);
  
  // Handle starting to edit a role
  const handleEditRole = (role: any) => {
    setEditingRoleId(role.id);
    setNewRoleName(role.name);
    setNewRoleDescription(role.description || '');
    
    // Initialize selected permissions based on role's current permissions
    const permMap: Record<string, boolean> = {};
    permissions.forEach((perm: any) => {
      permMap[perm.id] = role.permissions?.some((p: Permission) => p.id === perm.id) || false;
    });
    setSelectedPermissions(permMap);
  };
  
  // Handle saving role changes
  const handleSaveRole = async () => {
    if (editingRoleId) {
      // Get selected permission IDs
      const permissionIds = Object.entries(selectedPermissions)
        .filter(([_, isSelected]) => isSelected)
        .map(([id]) => id);
      
      await updateRole({
        roleId: editingRoleId,
        roleData: {
          name: newRoleName,
          description: newRoleDescription,
          permissionIds
        }
      });
      
      // Reset editing state
      setEditingRoleId(null);
    }
  };
  
  // Handle creating a new role
  const handleCreateRole = async () => {
    // Get selected permission IDs
    const permissionIds = Object.entries(selectedPermissions)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);
    
    await createRole({
      name: newRoleName,
      description: newRoleDescription,
      permissionIds
    });
    
    // Reset form
    setNewRoleName('');
    setNewRoleDescription('');
    setSelectedPermissions({});
    setShowNewRoleForm(false);
  };
  
  // Handle deleting a role
  const handleDeleteRole = async (roleId: string) => {
    if (window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      await deleteRole(roleId);
    }
  };
  
  // Handle toggling a permission
  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId]
    }));
  };
  
  // Handle starting new role creation
  const handleStartNewRole = () => {
    setShowNewRoleForm(true);
    setNewRoleName('');
    setNewRoleDescription('');
    
    // Initialize all permissions as unselected
    const permMap: Record<string, boolean> = {};
    permissions.forEach((perm: any) => {
      permMap[perm.id] = false;
    });
    setSelectedPermissions(permMap);
  };
  
  // Handle canceling edit/create
  const handleCancel = () => {
    setEditingRoleId(null);
    setShowNewRoleForm(false);
  };
  
  // Loading state
  if (isLoadingRoles || isLoadingPermissions) {
    return (
      <AdminLayout title="Role Management" requirePermission="manage_roles">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading roles and permissions...</span>
        </div>
      </AdminLayout>
    );
  }
  
  // Error state
  if (isErrorRoles || isErrorPermissions) {
    return (
      <AdminLayout title="Role Management" requirePermission="manage_roles">
        <div className="flex items-center justify-center h-64 text-red-500">
          <AlertTriangle className="h-8 w-8 mr-2" />
          <span>Error loading roles and permissions. Please try again.</span>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title="Role Management" requirePermission="manage_roles">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Role Management</h1>
        
        <div className="mt-4 md:mt-0">
          <button
            onClick={handleStartNewRole}
            disabled={showNewRoleForm || editingRoleId !== null}
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Role
          </button>
        </div>
      </div>
      
      {/* New Role Form */}
      {showNewRoleForm && (
        <div className="bg-white rounded-lg shadow mb-6 p-6 border-l-4 border-primary">
          <h2 className="text-lg font-medium text-slate-800 mb-4">Create New Role</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="roleName" className="block text-sm font-medium text-slate-700 mb-1">
                Role Name
              </label>
              <input
                type="text"
                id="roleName"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="e.g. Content Editor"
              />
            </div>
            
            <div>
              <label htmlFor="roleDescription" className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <input
                type="text"
                id="roleDescription"
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="e.g. Can edit and manage content"
              />
            </div>
          </div>
          
          <h3 className="text-md font-medium text-slate-800 mb-3">Permissions</h3>
          
          <div className="mb-6 border border-slate-200 rounded-md">
            {Object.entries(permissionsByCategory).map(([category, perms]) => (
              <div key={category} className="border-b border-slate-200 last:border-b-0">
                <div className="px-4 py-3 bg-slate-50">
                  <h4 className="text-sm font-medium text-slate-700">{category}</h4>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(perms as Permission[]).map((permission: Permission) => (
                    <label key={permission.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedPermissions[permission.id] || false}
                        onChange={() => handleTogglePermission(permission.id)}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span className="ml-2 text-sm text-slate-700">
                        {permission.name}
                        {permission.description && (
                          <span className="block text-xs text-slate-500">{permission.description}</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateRole}
              disabled={!newRoleName.trim() || isCreatingPending}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Role
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Roles List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Users
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-slate-500">
                    No roles found. Create your first role to get started.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <React.Fragment key={role.id}>
                    <tr className={editingRoleId === role.id ? 'bg-blue-50' : 'hover:bg-slate-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingRoleId === role.id ? (
                          <input
                            type="text"
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                          />
                        ) : (
                          <div className="text-sm font-medium text-slate-900">{role.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingRoleId === role.id ? (
                          <input
                            type="text"
                            value={newRoleDescription}
                            onChange={(e) => setNewRoleDescription(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                          />
                        ) : (
                          <div className="text-sm text-slate-500">{role.description || '-'}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-500">
                          {(role as any).userCount || 0} users
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {editingRoleId !== role.id && (
                          <div className="flex flex-wrap gap-1">
                            {role.permissions?.slice(0, 3).map((perm: any) => (
                              <span 
                                key={perm.id} 
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800"
                              >
                                {perm.name}
                              </span>
                            ))}
                            {(role.permissions?.length || 0) > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                +{(role.permissions?.length || 0) - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingRoleId === role.id ? (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={handleCancel}
                              className="text-slate-400 hover:text-slate-500"
                            >
                              <X className="h-5 w-5" />
                            </button>
                            <button
                              onClick={handleSaveRole}
                              disabled={isUpdatingPending}
                              className="text-primary hover:text-primary-dark"
                            >
                              {isUpdatingPending ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <Check className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditRole(role)}
                              disabled={editingRoleId !== null || showNewRoleForm}
                              className="text-slate-400 hover:text-slate-500 disabled:opacity-50"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRole(role.id)}
                              disabled={isDeletingPending || role.isSystem || ((role as any).userCount || 0) > 0}
                              className="text-red-400 hover:text-red-500 disabled:opacity-50"
                              title={
                                role.isSystem 
                                  ? "System roles cannot be deleted" 
                                  : ((role as any).userCount || 0) > 0 
                                    ? "Cannot delete roles with assigned users" 
                                    : "Delete role"
                              }
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    
                    {/* Permissions editor when editing */}
                    {editingRoleId === role.id && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-blue-50">
                          <h3 className="text-md font-medium text-slate-800 mb-3">Edit Permissions</h3>
                          
                          <div className="border border-slate-200 rounded-md bg-white">
                            {Object.entries(permissionsByCategory).map(([category, perms]) => (
                              <div key={category} className="border-b border-slate-200 last:border-b-0">
                                <div className="px-4 py-2 bg-slate-50">
                                  <h4 className="text-sm font-medium text-slate-700">{category}</h4>
                                </div>
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {(perms as Permission[]).map((permission: Permission) => (
                                    <label key={permission.id} className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedPermissions[permission.id] || false}
                                        onChange={() => handleTogglePermission(permission.id)}
                                        className="rounded border-slate-300 text-primary focus:ring-primary"
                                      />
                                      <span className="ml-2 text-sm text-slate-700">
                                        {permission.name}
                                        {permission.description && (
                                          <span className="block text-xs text-slate-500">{permission.description}</span>
                                        )}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
