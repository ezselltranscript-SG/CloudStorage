import { supabase } from './supabase-client';
import type { Database } from '../../types/supabase';
// Eliminamos la importación no utilizada

export type Folder = Database['public']['Tables']['folders']['Row'];
export type FolderInsert = Database['public']['Tables']['folders']['Insert'];
export type FolderUpdate = Database['public']['Tables']['folders']['Update'];

/**
 * Servicio para manejar las operaciones CRUD de carpetas
 */
export const folderService = {
  /**
   * Obtiene todas las carpetas del usuario actual
   * @param userId - ID del usuario autenticado
   */
  async getAllFolders(userId?: string) {
    let query = supabase
      .from('folders')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Si se proporciona un userId, filtrar por ese usuario
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  },

  /**
   * Obtiene las carpetas hijas de una carpeta padre para el usuario actual
   * @param parentId - ID de la carpeta padre (null para carpetas raíz)
   * @param userId - ID del usuario autenticado
   */
  async getFoldersByParentId(parentId: string | null, userId?: string) {
    let query = supabase
      .from('folders')
      .select('*')
      .order('name');
    
    // Manejar el caso de parent_id nulo de manera especial
    if (parentId === null) {
      query = query.is('parent_id', null);
    } else {
      query = query.eq('parent_id', parentId);
    }
    
    // Si se proporciona un userId, filtrar por ese usuario
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  },

  /**
   * Obtiene una carpeta por su ID para el usuario actual
   * @param id - ID de la carpeta
   * @param userId - ID del usuario autenticado
   */
  async getFolderById(id: string, userId?: string) {
    let query = supabase
      .from('folders')
      .select('*')
      .eq('id', id);
    
    // Si se proporciona un userId, filtrar por ese usuario
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Crea una nueva carpeta asociada al usuario actual
   * @param folder - Datos de la carpeta a crear
   * @param userId - ID del usuario autenticado
   */
  async createFolder(folder: FolderInsert, userId?: string) {
    // Si se proporciona un userId, asociar la carpeta a ese usuario
    const folderWithUser = userId ? { ...folder, user_id: userId } : folder;
    
    const { data, error } = await supabase
      .from('folders')
      .insert(folderWithUser)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Actualiza una carpeta existente del usuario actual
   * @param id - ID de la carpeta a actualizar
   * @param folder - Datos actualizados de la carpeta
   * @param userId - ID del usuario autenticado
   */
  async updateFolder(id: string, folder: FolderUpdate, userId?: string) {
    let query = supabase
      .from('folders')
      .update(folder)
      .eq('id', id);
    
    // Si se proporciona un userId, filtrar por ese usuario
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.select().single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Elimina una carpeta por su ID del usuario actual
   * @param id - ID de la carpeta a eliminar
   * @param userId - ID del usuario autenticado
   */
  async deleteFolder(id: string, userId?: string) {
    let query = supabase
      .from('folders')
      .delete()
      .eq('id', id);
    
    // Si se proporciona un userId, filtrar por ese usuario
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { error } = await query;
    
    if (error) throw error;
    return true;
  }
};
