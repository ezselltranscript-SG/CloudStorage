/**
 * User management service for admin dashboard
 */

import { AdminServiceBase } from './admin-service-base';
import type { AdminUser } from '../types/admin-user';
import type { CreateUserData, UpdateUserData } from '../types/admin-user';
import type { Role } from '../types/permissions';
import type { AuditActionType } from '../types/audit';

interface UserFilters {
  query?: string;
  role?: string;
  isActive?: boolean;
  isSuspended?: boolean;
  sortBy?: 'email' | 'createdAt' | 'lastLoginAt' | 'storageUsed';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export class UserService extends AdminServiceBase {
  /**
   * Get users with pagination and filtering
   */
  async getUsers(filters: UserFilters = {}): Promise<{
    users: AdminUser[];
    total: number;
  }> {
    try {
      const {
        query,
        role,
        isActive,
        isSuspended,
        sortBy = 'createdAt',
        sortDirection = 'desc',
        page = 1,
        pageSize = 10
      } = filters;
      
      // Start building the query
      let query_builder = this.supabase
        .from('users')
        .select('*', { count: 'exact' });
      
      // Apply filters
      if (query) {
        query_builder = query_builder.or(`email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`);
      }
      
      if (isActive !== undefined) {
        query_builder = query_builder.eq('is_active', isActive);
      }
      
      if (isSuspended !== undefined) {
        query_builder = query_builder.eq('is_suspended', isSuspended);
      }
      
      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query_builder = query_builder
        .order(sortBy, { ascending: sortDirection === 'asc' })
        .range(from, to);
      
      // Execute the query
      const { data: usersData, count, error } = await query_builder;
      
      if (error) throw error;
      
      // If role filter is applied, we need to fetch user roles and filter client-side
      // because it's a many-to-many relationship
      let filteredUsers = usersData || [];
      
      if (role) {
        // Get all user_roles for the specified role
        const { data: userRoles } = await this.supabase
          .from('user_roles')
          .select('user_id')
          .eq('role_id', role);
        
        if (userRoles) {
          const userIdsWithRole = userRoles.map(ur => ur.user_id);
          filteredUsers = filteredUsers.filter(user => 
            userIdsWithRole.includes(user.id)
          );
        }
      }
      
      // Get roles for all users
      const userIds = filteredUsers.map(user => user.id);
      
      const { data: allUserRoles } = await this.supabase
        .from('user_roles')
        .select('user_id, role_id')
        .in('user_id', userIds);
      
      // Map user roles to users
      const userRolesMap: Record<string, string[]> = {};
      
      if (allUserRoles) {
        allUserRoles.forEach(ur => {
          if (!userRolesMap[ur.user_id]) {
            userRolesMap[ur.user_id] = [];
          }
          userRolesMap[ur.user_id].push(ur.role_id);
        });
      }
      
      // Transform to AdminUser type
      const users: AdminUser[] = filteredUsers.map(user => {
        const firstName = user.first_name || '';
        const lastName = user.last_name || '';
        
        // Convert string role names to Role objects
        const roleStrings = userRolesMap[user.id] || [];
        const roles: Role[] = roleStrings.map(roleName => ({
          id: roleName, // Using role name as ID temporarily
          name: roleName,
          description: '',
          isSystem: false,
          createdAt: '',
          updatedAt: ''
        }));
        
        return {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          fullName: `${firstName} ${lastName}`.trim(),
          createdAt: user.created_at,
          lastLoginAt: user.last_login_at,
          isActive: user.is_active || true,
          isSuspended: user.is_suspended || false,
          storageUsed: user.storage_used || 0,
          fileCount: 0, // Will be updated with actual count if needed
          roles: roles
        };
      });
      
      return {
        users,
        total: count || users.length
      };
    } catch (error) {
      console.error('Failed to get users:', error);
      return { users: [], total: 0 };
    }
  }
  
  /**
   * Get a single user by ID
   */
  async getUserById(userId: string): Promise<AdminUser | null> {
    try {
      const { data: user, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }

      if (!user) return null;

      // Get user roles
      const { data: userRoles } = await this.supabase
        .from('user_roles')
        .select('role_name')
        .eq('user_id', userId);
      
      // Convert role names to Role objects
      const roles: Role[] = (userRoles?.map(ur => ur.role_name) || []).map(roleName => ({
        id: roleName,
        name: roleName,
        description: '',
        isSystem: false,
        createdAt: '',
        updatedAt: ''
      }));
      
      const firstName = user.first_name || '';
      const lastName = user.last_name || '';
      
      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        fullName: `${firstName} ${lastName}`.trim(),
        roles: roles,
        isActive: user.is_active || true,
        isSuspended: user.is_suspended || false,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        fileCount: 0,
        storageUsed: user.storage_used || 0
      };
    } catch (error) {
      console.error('Error in getUserById:', error);
      return null;
    }
  }
  
  /**
   * Create a new user
   */
  async createUser(
    currentUserId: string,
    currentUserEmail: string,
    userData: CreateUserData
  ): Promise<{ user: AdminUser | null; error: string | null }> {
    try {
      // Create user in auth
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      });
      
      if (authError || !authData.user) {
        return { user: null, error: authError?.message || 'Failed to create user' };
      }
      
      // Create user in users table
      const { error: userError } = await this.supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          first_name: userData.firstName || '',
          last_name: userData.lastName || '',
          is_active: true,
          is_suspended: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (userError) {
        return { user: null, error: userError.message };
      }
      
      // Assign roles
      if (userData.roleIds.length > 0) {
        const userRoles = userData.roleIds.map(roleId => ({
          user_id: authData.user.id,
          role_id: roleId
        }));
        
        const { error: roleError } = await this.supabase
          .from('user_roles')
          .insert(userRoles);
        
        if (roleError) {
          return { user: null, error: roleError.message };
        }
      }
      
      // Create audit log
      await this.createAuditLog(
        currentUserId,
        currentUserEmail,
        'user_create' as AuditActionType,
        'user',
        authData.user.id,
        userData.email,
        { roles: userData.roleIds }
      );
      
      // Get the created user
      const user = await this.getUserById(authData.user.id);
      
      return { user, error: null };
    } catch (error: any) {
      console.error('Failed to create user:', error);
      return { user: null, error: error.message || 'An unknown error occurred' };
    }
  }
  
  /**
   * Update a user
   */
  async updateUser(
    currentUserId: string,
    currentUserEmail: string,
    userId: string,
    userData: UpdateUserData
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get original user data for audit
      const originalUser = await this.getUserById(userId);
      
      if (!originalUser) {
        return { success: false, error: 'User not found' };
      }
      
      // Update user in users table
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      
      if (userData.firstName !== undefined) updates.first_name = userData.firstName;
      if (userData.lastName !== undefined) updates.last_name = userData.lastName;
      if (userData.isActive !== undefined) updates.is_active = userData.isActive;
      if (userData.isSuspended !== undefined) updates.is_suspended = userData.isSuspended;
      
      const { error: userError } = await this.supabase
        .from('users')
        .update(updates)
        .eq('id', userId);
      
      if (userError) {
        return { success: false, error: userError.message };
      }
      
      // Update roles if provided
      if (userData.roleIds !== undefined) {
        // Delete existing roles
        const { error: deleteError } = await this.supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
        
        if (deleteError) {
          return { success: false, error: deleteError.message };
        }
        
        // Insert new roles
        if (userData.roleIds.length > 0) {
          const userRoles = userData.roleIds.map(roleId => ({
            user_id: userId,
            role_id: roleId
          }));
          
          const { error: insertError } = await this.supabase
            .from('user_roles')
            .insert(userRoles);
          
          if (insertError) {
            return { success: false, error: insertError.message };
          }
        }
      }
      
      // Create audit log
      await this.createAuditLog(
        currentUserId,
        currentUserEmail,
        'user_update' as AuditActionType,
        'user',
        userId,
        originalUser.email,
        {
          changes: {
            firstName: userData.firstName !== undefined ? { from: originalUser.firstName, to: userData.firstName } : undefined,
            lastName: userData.lastName !== undefined ? { from: originalUser.lastName, to: userData.lastName } : undefined,
            isActive: userData.isActive !== undefined ? { from: originalUser.isActive, to: userData.isActive } : undefined,
            isSuspended: userData.isSuspended !== undefined ? { from: originalUser.isSuspended, to: userData.isSuspended } : undefined,
            roles: userData.roleIds !== undefined ? { from: originalUser.roles, to: userData.roleIds } : undefined
          }
        }
      );
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Failed to update user:', error);
      return { success: false, error: error.message || 'An unknown error occurred' };
    }
  }
  
  /**
   * Delete a user
   */
  async deleteUser(
    currentUserId: string,
    currentUserEmail: string,
    userId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get original user data for audit
      const originalUser = await this.getUserById(userId);
      
      if (!originalUser) {
        return { success: false, error: 'User not found' };
      }
      
      // Delete user roles
      const { error: rolesError } = await this.supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (rolesError) {
        return { success: false, error: rolesError.message };
      }
      
      // Delete user from users table
      const { error: userError } = await this.supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (userError) {
        return { success: false, error: userError.message };
      }
      
      // Delete user from auth
      const { error: authError } = await this.supabase.auth.admin.deleteUser(userId);
      
      if (authError) {
        return { success: false, error: authError.message };
      }
      
      // Create audit log
      await this.createAuditLog(
        currentUserId,
        currentUserEmail,
        'user_delete' as AuditActionType,
        'user',
        userId,
        originalUser.email
      );
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      return { success: false, error: error.message || 'An unknown error occurred' };
    }
  }
  
  /**
   * Suspend or activate a user
   */
  async toggleUserSuspension(
    currentUserId: string,
    currentUserEmail: string,
    userId: string,
    suspend: boolean
  ): Promise<{ success: boolean; error: string | null }> {
    return this.updateUser(
      currentUserId,
      currentUserEmail,
      userId,
      { isSuspended: suspend }
    );
  }
  
  /**
   * Get user storage statistics
   */
  async getUserStorageStats(userId: string): Promise<{
    fileCount: number;
    folderCount: number;
    totalSize: number;
  }> {
    try {
      // Get file count and total size
      const { data: filesData, error: filesError } = await this.supabase
        .from('files')
        .select('size')
        .eq('user_id', userId);
      
      if (filesError) throw filesError;
      
      // Get folder count
      const { count: folderCount, error: foldersError } = await this.supabase
        .from('folders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (foldersError) throw foldersError;
      
      const fileCount = filesData?.length || 0;
      const totalSize = filesData?.reduce((sum, file) => sum + (file.size || 0), 0) || 0;
      
      return {
        fileCount,
        folderCount: folderCount || 0,
        totalSize
      };
    } catch (error) {
      console.error('Failed to get user storage stats:', error);
      return { fileCount: 0, folderCount: 0, totalSize: 0 };
    }
  }
}

// Export a singleton instance
export const userService = new UserService();
