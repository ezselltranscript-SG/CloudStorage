import { supabase, STORAGE_BUCKET } from './supabase-client';
import type { Database } from '../../types/supabase';
// Eliminamos la importación no utilizada

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
   */
  async getFilesByFolderId(folderId: string, userId?: string) {
    let query = supabase
      .from('files')
      .select('*')
      .eq('folder_id', folderId)
      .is('deleted_at', null) // Solo archivos activos
      .order('id');
    
    // Si se proporciona un userId, filtrar por ese usuario
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
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
  async uploadFile(file: { id: string; filename: string; folder_id: string; storage_path?: string; created_at?: string }, fileData: Blob, userId?: string) {
    // 1. Subir el archivo al Storage
    if (!userId) {
      throw new Error('Missing userId for upload');
    }
    const fileExt = file.filename.split('.').pop();
    // Guardamos bajo prefijo del usuario para cumplir RLS de Storage (userId/...)
    const filePath = `${userId}/${file.folder_id}/${file.id}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, fileData);
    
    if (uploadError) throw uploadError;

    // 2. Crear el registro en la base de datos
    const fileRecord: FileInsert = {
      id: file.id,
      // Mapear UI filename -> DB name
      name: file.filename,
      size: (fileData as any)?.size ?? undefined,
      type: (fileData as any)?.type || 'application/octet-stream',
      folder_id: file.folder_id,
      storage_path: filePath,
      user_id: userId as string
    } as unknown as FileInsert;

    const { data, error } = await supabase
      .from('files')
      .insert(fileRecord)
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
  }
};
