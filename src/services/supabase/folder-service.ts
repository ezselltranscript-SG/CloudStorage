import { supabase } from './supabase-client';
import type { Database } from '../../types/supabase';
import { validateParentFolder } from './storage-path-utils';

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
   * @param includeShared - Si incluir carpetas compartidas por otros usuarios
   */
  async getAllFolders() {
    // Verificar autenticación antes de la query
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .is('deleted_at', null) // Solo carpetas activas
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Obtiene las carpetas hijas de una carpeta padre para el usuario actual
   * @param parentId - ID de la carpeta padre (null para carpetas raíz)
   * @param userId - ID del usuario autenticado
   * @param includeShared - Si incluir carpetas compartidas por otros usuarios
   */
  async getFoldersByParentId(parentId: string | null) {
    // Verificar autenticación antes de la query
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    let query = supabase
      .from('folders')
      .select('*')
      .is('deleted_at', null) // Solo carpetas activas
      .order('created_at', { ascending: false });

    // Manejar correctamente el caso cuando parentId es null
    if (parentId === null) {
      query = query.is('parent_id', null);
    } else {
      query = query.eq('parent_id', parentId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    return data || [];
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
      .eq('id', id)
      .is('deleted_at', null); // Solo carpetas activas
    
    // Si se proporciona un userId, filtrar por ese usuario
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.maybeSingle();
    
    if (error) throw error;
    return data;
  },

  /**
   * Crea una nueva carpeta asociada al usuario actual
   * @param folder - Datos de la carpeta a crear
   * @param userId - ID del usuario autenticado
   */
  async createFolder(folder: FolderInsert, userId?: string) {
    // Requerimos userId para cumplir RLS y unicidad por usuario
    if (!userId) throw new Error('Missing userId for folder creation');

    const baseName = (folder as any).name as string;
    // Validar parent_id: debe existir y pertenecer al usuario
    let normalizedParentId: string | null = (folder as any).parent_id ?? null;
    
    if (normalizedParentId) {
      const isValidParent = await validateParentFolder(normalizedParentId, userId);
      if (!isValidParent) {
        throw new Error('Invalid parent folder or folder does not belong to user');
      }
    }
    let attempt = 0;
    let nameToTry = baseName;

    while (attempt < 20) {
      const folderData: FolderInsert = {
        name: nameToTry,
        parent_id: normalizedParentId,
        user_id: userId,
        is_shared: true, // Default to shared for organization-wide access
      };

      const { data, error } = await supabase
        .from('folders')
        .insert(folderData)
        .select()
        .maybeSingle();

      if (!error) return data;

      // Si es conflicto de unicidad, incrementamos sufijo y reintentamos
      const code = (error as any)?.code;
      const status = (error as any)?.status;
      if (code === '23505' || status === 409) {
        attempt++;
        nameToTry = `${baseName} (${attempt + 1})`;
        continue;
      }

      // Otro tipo de error: propagar
      throw error;
    }

    throw new Error('Could not create a unique folder name after multiple attempts');
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
    
    const { data, error } = await query.select().maybeSingle();
    
    if (error) throw error;
    return data;
  },

  /**
   * Mueve una carpeta a la papelera (soft delete)
   * @param id - ID de la carpeta a mover a papelera
   * @param userId - ID del usuario autenticado
   */
  async moveToTrash(id: string, userId?: string) {
    // Primero obtenemos la carpeta para guardar su parent_id original
    const folder = await this.getFolderById(id, userId);
    if (!folder) throw new Error('Folder not found');
    
    let query = supabase
      .from('folders')
      .update({ 
        deleted_at: new Date().toISOString(),
        original_parent_id: folder.parent_id
      })
      .eq('id', id)
      .is('deleted_at', null); // Solo si no está ya eliminado
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.select().maybeSingle();
    if (error) throw error;
    return data;
  },

  /**
   * Restaura una carpeta desde la papelera
   * @param id - ID de la carpeta a restaurar
   * @param userId - ID del usuario autenticado
   */
  async restoreFromTrash(id: string, userId?: string) {
    // Obtener la carpeta eliminada para restaurar su parent_id original
    let getQuery = supabase
      .from('folders')
      .select('original_parent_id')
      .eq('id', id)
      .not('deleted_at', 'is', null);
    
    if (userId) {
      getQuery = getQuery.eq('user_id', userId);
    }
    
    const { data: folderData, error: getError } = await getQuery.maybeSingle();
    if (getError) throw getError;
    if (!folderData) throw new Error('Folder not found in trash');
    
    let query = supabase
      .from('folders')
      .update({ 
        deleted_at: null,
        parent_id: folderData.original_parent_id,
        original_parent_id: null
      })
      .eq('id', id)
      .not('deleted_at', 'is', null); // Solo si está eliminado
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.select().maybeSingle();
    if (error) throw error;
    return data;
  },

  /**
   * Obtiene carpetas en la papelera del usuario
   * @param userId - ID del usuario autenticado
   */
  async getTrashFolders(userId?: string) {
    let query = supabase
      .from('folders')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },


  /**
   * Elimina permanentemente una carpeta (hard delete)
   * @param id - ID de la carpeta a eliminar permanentemente
   * @param userId - ID del usuario autenticado
   */
  async permanentDelete(id: string, userId?: string) {
    let query = supabase
      .from('folders')
      .delete()
      .eq('id', id);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { error } = await query;
    if (error) throw error;
    return true;
  },

  /**
   * Elimina una carpeta (backward compatibility - ahora usa soft delete)
   * @param id - ID de la carpeta a eliminar
   * @param userId - ID del usuario autenticado
   */
  async deleteFolder(id: string, userId?: string) {
    // Por compatibilidad, ahora hace soft delete
    return this.moveToTrash(id, userId);
  },

  /**
   * Cambia el estado de compartición de una carpeta
   * @param folderId - ID de la carpeta
   * @param isShared - Nuevo estado de compartición
   * @param userId - ID del usuario (debe ser el owner)
   */
  async toggleFolderSharing(folderId: string, isShared: boolean, userId: string) {
    const { data, error } = await supabase
      .from('folders')
      .update({ is_shared: isShared })
      .eq('id', folderId)
      .eq('user_id', userId) // Solo el owner puede cambiar el estado
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }
};
