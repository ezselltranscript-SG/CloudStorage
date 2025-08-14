/**
 * Admin file and folder management service
 * Provides admin-specific operations on files and folders
 */

import { AdminServiceBase } from './admin-service-base';

// Use admin file types
import type { AdminFile, AdminFolder, AdminFileFilters, AdminFolderFilters } from '../types/admin-file';

// Types are now imported from admin-file.ts

export class AdminFileService extends AdminServiceBase {
  /**
   * Get files with pagination and filtering
   */
  async getFiles(filters: AdminFileFilters = { 
    includeDeleted: false,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    page: 1,
    pageSize: 10
  }): Promise<{
    files: AdminFile[];
    total: number;
  }> {
    try {
      const {
        userId,
        folderId,
        query,
        includeDeleted = filters.includeDeleted,
        sortBy = filters.sortBy,
        sortDirection = filters.sortDirection,
        page = filters.page,
        pageSize = filters.pageSize
      } = filters as AdminFileFilters;
      
      // Start building the query
      let query_builder = this.supabase
        .from('files')
        .select('*, users!inner(email)', { count: 'exact' });
      
      // Apply filters
      if (userId) {
        query_builder = query_builder.eq('user_id', userId);
      }
      
      if (folderId) {
        query_builder = query_builder.eq('folder_id', folderId);
      }
      
      if (query) {
        query_builder = query_builder.ilike('name', `%${query}%`);
      }
      
      if (!includeDeleted) {
        query_builder = query_builder.is('deleted_at', null);
      }
      
      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Apply sorting
      let sortColumn = sortBy;
      if (sortBy === 'createdAt') sortColumn = 'createdAt';
      if (sortBy === 'updatedAt') sortColumn = 'updatedAt';
      if (sortBy === 'name') sortColumn = 'name';
      if (sortBy === 'size') sortColumn = 'size';
      
      query_builder = query_builder
        .order(sortColumn, { ascending: sortDirection === 'asc' })
        .range(from, to);
      
      // Execute the query
      const { data, count, error } = await query_builder;
      
      if (error) throw error;
      
      // Transform to AdminFile type
      const files: AdminFile[] = (data || []).map(file => ({
        id: file.id,
        filename: file.name,
        name: file.name,
        size: file.size,
        type: file.type,
        mimetype: file.type,
        folder_id: file.folder_id,
        folderId: file.folder_id,
        storage_path: file.storage_path || '',
        url: file.url,
        thumbnailUrl: file.thumbnail_url,
        createdAt: file.created_at,
        updatedAt: file.updated_at,
        userId: file.user_id,
        userEmail: file.users?.email || '',
        isDeleted: !!file.deleted_at,
        deletedAt: file.deleted_at
      }));
      
      return {
        files,
        total: count || files.length
      };
    } catch (error) {
      console.error('Failed to get files:', error);
      return { files: [], total: 0 };
    }
  }
  
  /**
   * Get folders with pagination and filtering
   */
  async getFolders(filters: AdminFolderFilters = {
    includeDeleted: false,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    page: 1,
    pageSize: 10
  }): Promise<{
    folders: AdminFolder[];
    total: number;
  }> {
    try {
      const {
        userId,
        parentId,
        query,
        includeDeleted = filters.includeDeleted,
        page = filters.page,
        pageSize = filters.pageSize
      } = filters as AdminFolderFilters;
      
      // Start building the query
      let query_builder = this.supabase
        .from('folders')
        .select('*, users!inner(email)', { count: 'exact' });
      
      // Apply filters
      if (userId) {
        query_builder = query_builder.eq('user_id', userId);
      }
      
      if (parentId === null) {
        query_builder = query_builder.is('parent_id', null);
      } else if (parentId !== undefined) {
        query_builder = query_builder.eq('parent_id', parentId);
      }
      
      if (query) {
        query_builder = query_builder.ilike('name', `%${query}%`);
      }
      
      if (!includeDeleted) {
        query_builder = query_builder.is('deleted_at', null);
      }
      
      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Apply sorting
      if (filters.sortBy && filters.sortDirection) {
        query_builder = query_builder.order(filters.sortBy === 'name' ? 'name' : 
          filters.sortBy === 'createdAt' ? 'created_at' : 
          filters.sortBy === 'updatedAt' ? 'updated_at' : 'created_at', 
          { ascending: filters.sortDirection === 'asc' });
      } else {
        query_builder = query_builder.order('created_at', { ascending: false });
      }
      
      // Apply pagination
      query_builder = query_builder.range(from, to);
      
      // Execute the query
      const { data, count, error } = await query_builder;
      
      if (error) throw error;
      
      // Transform to AdminFolder type
      const folders: AdminFolder[] = (data || []).map(folder => ({
        id: folder.id,
        name: folder.name,
        parent_id: folder.parent_id,
        parentId: folder.parent_id,
        path: folder.path || '',
        createdAt: folder.created_at,
        updatedAt: folder.updated_at,
        userId: folder.user_id,
        userEmail: folder.users?.email || '',
        isDeleted: !!folder.deleted_at,
        deletedAt: folder.deleted_at
      }));
      
      return {
        folders,
        total: count || folders.length
      };
    } catch (error) {
      console.error('Failed to get folders:', error);
      return { folders: [], total: 0 };
    }
  }
  
  /**
   * Soft delete a file (admin action)
   */
  async softDeleteFile(
    currentUserId: string,
    currentUserEmail: string,
    fileId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get file data for audit
      const { data: file, error: fileError } = await this.supabase
        .from('files')
        .select('*, users!inner(email)')
        .eq('id', fileId)
        .maybeSingle();
      
      if (fileError || !file) {
        return { success: false, error: fileError?.message || 'File not found' };
      }
      
      // Soft delete the file
      const { error } = await this.supabase
        .from('files')
        .update({
          deleted_at: new Date().toISOString()
        })
        .eq('id', fileId);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Create audit log
      await this.createAuditLog(
        currentUserId,
        currentUserEmail,
        'file_admin_delete',
        'file',
        fileId,
        file.name,
        {
          userId: file.user_id,
          userEmail: file.users?.email,
          folderId: file.folder_id
        }
      );
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Failed to soft delete file:', error);
      return { success: false, error: error.message || 'An unknown error occurred' };
    }
  }
  
  /**
   * Restore a soft-deleted file (admin action)
   */
  async restoreFile(
    currentUserId: string,
    currentUserEmail: string,
    fileId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get file data for audit
      const { data: file, error: fileError } = await this.supabase
        .from('files')
        .select('*, users!inner(email)')
        .eq('id', fileId)
        .maybeSingle();
      
      if (fileError || !file) {
        return { success: false, error: fileError?.message || 'File not found' };
      }
      
      // Restore the file
      const { error } = await this.supabase
        .from('files')
        .update({
          deleted_at: null
        })
        .eq('id', fileId);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Create audit log
      await this.createAuditLog(
        currentUserId,
        currentUserEmail,
        'file_admin_restore',
        'file',
        fileId,
        file.name,
        {
          userId: file.user_id,
          userEmail: file.users?.email,
          folderId: file.folder_id
        }
      );
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Failed to restore file:', error);
      return { success: false, error: error.message || 'An unknown error occurred' };
    }
  }
  
  /**
   * Soft delete a folder (admin action)
   */
  async softDeleteFolder(
    currentUserId: string,
    currentUserEmail: string,
    folderId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get folder data for audit
      const { data: folder, error: folderError } = await this.supabase
        .from('folders')
        .select('*, users!inner(email)')
        .eq('id', folderId)
        .maybeSingle();
      
      if (folderError || !folder) {
        return { success: false, error: folderError?.message || 'Folder not found' };
      }
      
      // Soft delete the folder
      const { error } = await this.supabase
        .from('folders')
        .update({
          deleted_at: new Date().toISOString()
        })
        .eq('id', folderId);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Create audit log
      await this.createAuditLog(
        currentUserId,
        currentUserEmail,
        'folder_admin_delete',
        'folder',
        folderId,
        folder.name,
        {
          userId: folder.user_id,
          userEmail: folder.users?.email,
          parentId: folder.parent_id
        }
      );
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Failed to soft delete folder:', error);
      return { success: false, error: error.message || 'An unknown error occurred' };
    }
  }
  
  /**
   * Restore a soft-deleted folder (admin action)
   */
  async restoreFolder(
    currentUserId: string,
    currentUserEmail: string,
    folderId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get folder data for audit
      const { data: folder, error: folderError } = await this.supabase
        .from('folders')
        .select('*, users!inner(email)')
        .eq('id', folderId)
        .maybeSingle();
      
      if (folderError || !folder) {
        return { success: false, error: folderError?.message || 'Folder not found' };
      }
      
      // Restore the folder
      const { error } = await this.supabase
        .from('folders')
        .update({
          deleted_at: null
        })
        .eq('id', folderId);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Create audit log
      await this.createAuditLog(
        currentUserId,
        currentUserEmail,
        'folder_admin_restore',
        'folder',
        folderId,
        folder.name,
        {
          userId: folder.user_id,
          userEmail: folder.users?.email,
          parentId: folder.parent_id
        }
      );
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Failed to restore folder:', error);
      return { success: false, error: error.message || 'An unknown error occurred' };
    }
  }
  
  /**
   * Get storage statistics
   */
  async getStorageStatistics(): Promise<{
    totalFiles: number;
    totalFolders: number;
    totalStorage: number;
    activeUsers: number;
  }> {
    try {
      // Get total files and storage
      const { data: filesData, error: filesError } = await this.supabase
        .from('files')
        .select('size')
        .is('deleted_at', null);
      
      if (filesError) throw filesError;
      
      // Get total folders
      const { count: folderCount, error: foldersError } = await this.supabase
        .from('folders')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);
      
      if (foldersError) throw foldersError;
      
      // Get active users
      const { count: userCount, error: usersError } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .is('is_suspended', false);
      
      if (usersError) throw usersError;
      
      const totalFiles = filesData?.length || 0;
      const totalStorage = filesData?.reduce((sum, file) => sum + (file.size || 0), 0) || 0;
      
      return {
        totalFiles,
        totalFolders: folderCount || 0,
        totalStorage,
        activeUsers: userCount || 0
      };
    } catch (error) {
      console.error('Failed to get storage statistics:', error);
      return {
        totalFiles: 0,
        totalFolders: 0,
        totalStorage: 0,
        activeUsers: 0
      };
    }
  }
  
  /**
   * Get top users by storage usage
   */
  async getTopUsersByStorage(limit = 5): Promise<Array<{
    userId: string;
    email: string;
    storageUsed: number;
    fileCount: number;
  }>> {
    try {
      // This is a complex query that would typically be done with a stored procedure
      // or a database view. For now, we'll simulate it with multiple queries.
      
      // Get all users
      const { data: users, error: usersError } = await this.supabase
        .from('users')
        .select('id, email')
        .eq('is_active', true)
        .is('is_suspended', false);
      
      if (usersError || !users) throw usersError;
      
      // For each user, get their storage usage
      const userStats = await Promise.all(
        users.map(async user => {
          const { data: files, error: filesError } = await this.supabase
            .from('files')
            .select('size')
            .eq('user_id', user.id)
            .is('deleted_at', null);
          
          if (filesError) throw filesError;
          
          const storageUsed = files?.reduce((sum, file) => sum + (file.size || 0), 0) || 0;
          const fileCount = files?.length || 0;
          
          return {
            userId: user.id,
            email: user.email,
            storageUsed,
            fileCount
          };
        })
      );
      
      // Sort by storage used and take the top N
      return userStats
        .sort((a, b) => b.storageUsed - a.storageUsed)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get top users by storage:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const adminFileService = new AdminFileService();
