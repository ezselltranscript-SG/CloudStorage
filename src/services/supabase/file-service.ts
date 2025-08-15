import { supabase, STORAGE_BUCKET } from './supabase-client';
import type { Database } from '../../types/supabase';
import { generateStoragePath, validateParentFolder } from './storage-path-utils';

export type File = Database['public']['Tables']['files']['Row'];
export type FileInsert = Database['public']['Tables']['files']['Insert'];
export type FileUpdate = Database['public']['Tables']['files']['Update'];

/**
 * Servicio para manejar las operaciones CRUD de archivos
 */
export const fileService = {
  /**
   * Obtiene todos los archivos de una carpeta para el usuario actual
   * @param folderId - ID de la carpeta
   * @param userId - ID del usuario autenticado
   * @param includeShared - Si incluir archivos compartidos por otros usuarios
   */
  async getFilesByFolderId(folderId: string | null) {
    // Verificar autenticación antes de la query
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    let query = supabase
      .from('files')
      .select('*')
      .is('deleted_at', null) // Solo archivos activos
      .order('id');

    // Manejar correctamente el caso cuando folderId es null
    if (folderId === null || folderId === 'null') {
      query = query.is('folder_id', null);
    } else {
      query = query.eq('folder_id', folderId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    // Adapt DB -> UI: exponer filename derivado de name
    return (data ?? []).map((row: any) => ({ ...row, filename: row.name }));
  },

  /**
   * Obtiene un archivo por su ID para el usuario actual
   * @param id - ID del archivo
   * @param userId - ID del usuario autenticado
   */
  async getFileById(id: string, userId?: string) {
    let query = supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null); // Solo archivos activos
    
    // Si se proporciona un userId, filtrar por ese usuario
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data ? { ...data, filename: (data as any).name } : data;
  },

  /**
   * Sube un archivo a Supabase Storage y crea un registro en la base de datos
   * @param file - Metadatos del archivo a subir
   * @param fileData - Contenido del archivo a subir (Blob)
   * @param userId - ID del usuario autenticado
   */
  async uploadFile(file: { id: string; filename: string; folder_id: string | null; storage_path?: string; created_at?: string; is_shared?: boolean }, fileBlob: Blob, userId?: string) {
    // 1. Validar entrada
    if (!userId) {
      throw new Error('Missing userId for upload');
    }

    // 2. Validar que la carpeta padre existe y pertenece al usuario
    if (file.folder_id) {
      console.log('Upload validation - folder_id:', file.folder_id, 'userId:', userId);
      const isValidParent = await validateParentFolder(file.folder_id, userId);
      console.log('Upload validation result:', isValidParent);
      if (!isValidParent) {
        throw new Error('Invalid parent folder or folder does not belong to user');
      }
    }

    // 3. Generar storage path correcto basado en jerarquía real
    const filePath = await generateStoragePath(userId, file.folder_id, file.id, file.filename);
    
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, fileBlob);
    
    if (uploadError) throw uploadError;

    // 4. Crear el registro en la base de datos
    const fileData: FileInsert = {
      name: file.filename,
      folder_id: file.folder_id,
      storage_path: filePath,
      size: (fileBlob as any)?.size ?? undefined,
      mimetype: (fileBlob as any)?.type || 'application/octet-stream',
      user_id: userId as string,
      is_shared: true // Default to shared for organization-wide access
    } as unknown as FileInsert;

    const { data, error } = await supabase
      .from('files')
      .insert(fileData)
      .select()
      .maybeSingle();
    
    if (error) {
      // Si hay error en la BD, eliminar el archivo del storage para mantener consistencia
      await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
      throw error;
    }
    
    // Adapt DB -> UI en la respuesta
    return data ? { ...data, filename: (data as any).name } : data;
  },

  /**
   * Actualiza un archivo existente del usuario actual
   * @param id - ID del archivo a actualizar
   * @param file - Datos actualizados del archivo
   * @param userId - ID del usuario autenticado
   */
  async updateFile(id: string, file: FileUpdate, userId?: string) {
    let query = supabase
      .from('files')
      .update(file)
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
   * Mueve un archivo a la papelera (soft delete)
   * @param id - ID del archivo a mover a papelera
   * @param userId - ID del usuario autenticado
   */
  async moveToTrash(id: string, userId?: string) {
    let query = supabase
      .from('files')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null); // Solo si no está ya eliminado
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.select().maybeSingle();
    if (error) throw error;
    return data ? { ...data, filename: (data as any).name } : data;
  },

  /**
   * Restaura un archivo desde la papelera
   * @param id - ID del archivo a restaurar
   * @param userId - ID del usuario autenticado
   */
  async restoreFromTrash(id: string, userId?: string) {
    let query = supabase
      .from('files')
      .update({ deleted_at: null })
      .eq('id', id)
      .not('deleted_at', 'is', null); // Solo si está eliminado
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.select().maybeSingle();
    if (error) throw error;
    return data ? { ...data, filename: (data as any).name } : data;
  },

  /**
   * Obtiene archivos en la papelera del usuario
   * @param userId - ID del usuario autenticado
   */
  async getTrashFiles(userId?: string) {
    let query = supabase
      .from('files')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row: any) => ({ ...row, filename: row.name }));
  },

  /**
   * Elimina permanentemente un archivo (hard delete)
   * @param id - ID del archivo a eliminar permanentemente
   * @param userId - ID del usuario autenticado
   */
  async permanentDelete(id: string, userId?: string) {
    // 1. Obtener la información del archivo para conocer la ruta de storage
    let query = supabase
      .from('files')
      .select('storage_path')
      .eq('id', id);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data: fileData, error: fetchError } = await query.maybeSingle();
    
    if (fetchError) throw fetchError;
    if (!fileData || !fileData.storage_path) {
      throw new Error('File not found or missing storage path');
    }
    
    // 2. Eliminar el archivo del storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([fileData.storage_path]);
    
    if (storageError) throw storageError;
    
    // 3. Eliminar el registro de la base de datos
    let deleteQuery = supabase
      .from('files')
      .delete()
      .eq('id', id);
    
    if (userId) {
      deleteQuery = deleteQuery.eq('user_id', userId);
    }
    
    const { error } = await deleteQuery;
    if (error) throw error;
    return true;
  },

  /**
   * Elimina un archivo (backward compatibility - ahora usa soft delete)
   * @param id - ID del archivo a eliminar
   * @param userId - ID del usuario autenticado
   */
  async deleteFile(id: string, userId?: string) {
    // Por compatibilidad, ahora hace soft delete
    return this.moveToTrash(id, userId);
  },

  /**
   * Obtiene la URL pública de un archivo
   * @param storagePath - Ruta del archivo en el storage
   */
  getPublicUrl(storagePath: string) {
    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);
    
    return data.publicUrl;
  },

  /**
   * Mueve un archivo a una carpeta diferente
   * @param fileId - ID del archivo a mover
   * @param newFolderId - ID de la carpeta destino (null para raíz)
   * @param userId - ID del usuario (debe ser el owner)
   */
  async moveFile(fileId: string, newFolderId: string | null, userId: string) {
    // 1. Validar que la carpeta destino existe y pertenece al usuario
    if (newFolderId) {
      const { validateParentFolder } = await import('./storage-path-utils');
      const isValidDestination = await validateParentFolder(newFolderId, userId);
      if (!isValidDestination) {
        throw new Error('Invalid destination folder or folder does not belong to user');
      }
    }

    // 2. Obtener información actual del archivo
    const currentFile = await this.getFileById(fileId, userId);
    if (!currentFile) {
      throw new Error('File not found or does not belong to user');
    }

    // 3. Generar nueva ruta de storage
    const { generateStoragePath } = await import('./storage-path-utils');
    const newStoragePath = await generateStoragePath(
      userId,
      newFolderId,
      fileId,
      currentFile.name
    );

    // 4. Mover archivo físico en storage
    const { error: moveError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .move(currentFile.storage_path, newStoragePath);

    if (moveError) {
      throw new Error(`Failed to move file in storage: ${moveError.message}`);
    }

    // 5. Actualizar registro en base de datos
    const { data, error } = await supabase
      .from('files')
      .update({
        folder_id: newFolderId,
        storage_path: newStoragePath,
        updated_at: new Date().toISOString()
      })
      .eq('id', fileId)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) {
      // Revertir movimiento en storage si falla la BD
      await supabase.storage
        .from(STORAGE_BUCKET)
        .move(newStoragePath, currentFile.storage_path);
      throw error;
    }

    return data ? { ...data, filename: (data as any).name } : data;
  },

  /**
   * Mueve múltiples archivos a una carpeta diferente
   * @param fileIds - Array de IDs de archivos a mover
   * @param newFolderId - ID de la carpeta destino (null para raíz)
   * @param userId - ID del usuario (debe ser el owner)
   */
  async moveMultipleFiles(fileIds: string[], newFolderId: string | null, userId: string) {
    const results = [];
    const errors = [];

    for (const fileId of fileIds) {
      try {
        const result = await this.moveFile(fileId, newFolderId, userId);
        results.push(result);
      } catch (error: any) {
        errors.push({ fileId, error: error.message });
      }
    }

    return { 
      moved: results, 
      errors,
      success: errors.length === 0
    };
  },

  /**
   * Cambia el estado de compartición de un archivo
   * @param fileId - ID del archivo
   * @param isShared - Nuevo estado de compartición
   * @param userId - ID del usuario (debe ser el owner)
   */
  async toggleFileSharing(fileId: string, isShared: boolean, userId: string) {
    const { data, error } = await supabase
      .from('files')
      .update({ is_shared: isShared })
      .eq('id', fileId)
      .eq('user_id', userId) // Solo el owner puede cambiar el estado
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data ? { ...data, filename: (data as any).name } : data;
  }
};
