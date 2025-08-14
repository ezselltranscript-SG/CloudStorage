/**
 * Role and permission management service for admin dashboard
 */

import { AdminServiceBase } from './admin-service-base';
import type { Permission, RoleWithPermissions } from '../types/auth';
import type { AuditLogAction } from '../types/audit-log';

export class RoleService extends AdminServiceBase {
  /**
   * Get all available permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    try {
      const { data, error } = await this.supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      
      return data.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category
      }));
    } catch (error) {
      console.error('Failed to get permissions:', error);
      return [];
    }
  }
  
  /**
   * Get all roles with their permissions
   */
  async getAllRoles(): Promise<RoleWithPermissions[]> {
    try {
      // Get all roles
      const { data: roles, error: rolesError } = await this.supabase
        .from('roles')
        .select('*')
        .order('name', { ascending: true });
      
      if (rolesError) throw rolesError;
      
      if (!roles || roles.length === 0) {
        return [];
      }
      
      // Get role permissions for all roles
      const { data: rolePermissions, error: permissionsError } = await this.supabase
        .from('role_permissions')
        .select('role_id, permission_id');
      
      if (permissionsError) throw permissionsError;
      
      // Map permissions to roles
      const rolePermissionsMap: Record<string, string[]> = {};
      
      if (rolePermissions) {
        rolePermissions.forEach(rp => {
          if (!rolePermissionsMap[rp.role_id]) {
            rolePermissionsMap[rp.role_id] = [];
          }
          rolePermissionsMap[rp.role_id].push(rp.permission_id);
        });
      }
      
      // Transform to RoleWithPermissions type
      return roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.is_system || false,
        permissions: rolePermissionsMap[role.id] || [],
        createdAt: role.created_at,
        updatedAt: role.updated_at
      }));
    } catch (error) {
      console.error('Failed to get roles with permissions:', error);
      return [];
    }
  }
  
  /**
   * Get a single role by ID with its permissions
   */
  async getRoleById(roleId: string): Promise<RoleWithPermissions | null> {
    try {
      const { data: role, error: roleError } = await this.supabase
        .from('roles')
        .select('*')
        .eq('id', roleId)
        .maybeSingle();
      
      if (roleError || !role) return null;
      
      // Get role permissions
      const { data: rolePermissions, error: permissionsError } = await this.supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId);
      
      if (permissionsError) throw permissionsError;
      
      return {
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.is_system || false,
        permissions: rolePermissions?.map(rp => rp.permission_id) || [],
        createdAt: role.created_at,
        updatedAt: role.updated_at
      };
    } catch (error) {
      console.error('Failed to get role by ID:', error);
      return null;
    }
  }
  
  /**
   * Create a new role
   */
  async createRole(
    currentUserId: string,
    currentUserEmail: string,
    roleData: {
      name: string;
      description: string;
      permissionIds: string[];
    }
  ): Promise<{ role: RoleWithPermissions | null; error: string | null }> {
    try {
      // Create role
      const { data: role, error: roleError } = await this.supabase
        .from('roles')
        .insert({
          name: roleData.name,
          description: roleData.description,
          is_system: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (roleError || !role) {
        return { role: null, error: roleError?.message || 'Failed to create role' };
      }
      
      // Assign permissions
      if (roleData.permissionIds.length > 0) {
        const rolePermissions = roleData.permissionIds.map(permissionId => ({
          role_id: role.id,
          permission_id: permissionId
        }));
        
        const { error: permissionsError } = await this.supabase
          .from('role_permissions')
          .insert(rolePermissions);
        
        if (permissionsError) {
          return { role: null, error: permissionsError.message };
        }
      }
      
      // Create audit log
      await this.createAuditLog(
        currentUserId,
        currentUserEmail,
        'role_created' as AuditLogAction,
        'role',
        role.id,
        roleData.name,
        { description: roleData.description }
      );
      
      // Get the created role
      const createdRole = await this.getRoleById(role.id);
      
      return { role: createdRole, error: null };
    } catch (error: any) {
      console.error('Failed to create role:', error);
      return { role: null, error: error.message || 'An unknown error occurred' };
    }
  }
  
  /**
   * Update a role
   */
  async updateRole(
    currentUserId: string,
    currentUserEmail: string,
    roleId: string,
    roleData: {
      name?: string;
      description?: string;
      permissionIds?: string[];
    }
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get original role data for audit
      const originalRole = await this.getRoleById(roleId);
      
      if (!originalRole) {
        return { success: false, error: 'Role not found' };
      }
      
      // Check if this is a system role
      if (originalRole.isSystem) {
        // For system roles, only allow updating permissions, not name or description
        if (roleData.name !== undefined || roleData.description !== undefined) {
          return { success: false, error: 'Cannot modify name or description of system roles' };
        }
      }
      
      // Update role
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      
      if (roleData.name !== undefined) updates.name = roleData.name;
      if (roleData.description !== undefined) updates.description = roleData.description;
      
      const { error: roleError } = await this.supabase
        .from('roles')
        .update(updates)
        .eq('id', roleId);
      
      if (roleError) {
        return { success: false, error: roleError.message };
      }
      
      // Update permissions if provided
      if (roleData.permissionIds !== undefined) {
        // Delete existing permissions
        const { error: deleteError } = await this.supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', roleId);
        
        if (deleteError) {
          return { success: false, error: deleteError.message };
        }
        
        // Insert new permissions
        if (roleData.permissionIds.length > 0) {
          const rolePermissions = roleData.permissionIds.map(permissionId => ({
            role_id: roleId,
            permission_id: permissionId
          }));
          
          const { error: insertError } = await this.supabase
            .from('role_permissions')
            .insert(rolePermissions);
          
          if (insertError) {
            return { success: false, error: insertError.message };
          }
        }
      }
      
      // Create audit log
      await this.createAuditLog(
        currentUserId,
        currentUserEmail,
        'role_updated' as AuditLogAction,
        'role',
        roleId,
        originalRole.name,
        {
          changes: {
            name: roleData.name !== undefined ? { from: originalRole.name, to: roleData.name } : undefined,
            description: roleData.description !== undefined ? { from: originalRole.description, to: roleData.description } : undefined,
            permissions: roleData.permissionIds !== undefined ? { from: originalRole.permissions, to: roleData.permissionIds } : undefined
          }
        }
      );
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Failed to update role:', error);
      return { success: false, error: error.message || 'An unknown error occurred' };
    }
  }
  
  /**
   * Delete a role
   */
  async deleteRole(
    currentUserId: string,
    currentUserEmail: string,
    roleId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get original role data for audit
      const originalRole = await this.getRoleById(roleId);
      
      if (!originalRole) {
        return { success: false, error: 'Role not found' };
      }
      
      // Check if this is a system role
      if (originalRole.isSystem) {
        return { success: false, error: 'Cannot delete system roles' };
      }
      
      // Check if any users have this role
      const { count, error: countError } = await this.supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role_id', roleId);
      
      if (countError) {
        return { success: false, error: countError.message };
      }
      
      if (count && count > 0) {
        return { success: false, error: `Cannot delete role that is assigned to ${count} users` };
      }
      
      // Delete role permissions
      const { error: permissionsError } = await this.supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);
      
      if (permissionsError) {
        return { success: false, error: permissionsError.message };
      }
      
      // Delete role
      const { error: roleError } = await this.supabase
        .from('roles')
        .delete()
        .eq('id', roleId);
      
      if (roleError) {
        return { success: false, error: roleError.message };
      }
      
      // Create audit log
      await this.createAuditLog(
        currentUserId,
        currentUserEmail,
        'role_deleted' as AuditLogAction,
        'role',
        roleId,
        originalRole.name
      );
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Failed to delete role:', error);
      return { success: false, error: error.message || 'An unknown error occurred' };
    }
  }
}

// Export a singleton instance
export const roleService = new RoleService();
