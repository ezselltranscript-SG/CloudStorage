import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fileService } from '../services/supabase/file-service';
import type { File, FileUpdate } from '../services/supabase/file-service';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para obtener archivos por ID de carpeta del usuario actual
 * @param folderId - ID de la carpeta
 * @param includeShared - Si incluir archivos compartidos por otros usuarios
 */
export const useFilesByFolderId = (folderId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['files', folderId],
    queryFn: () => fileService.getFilesByFolderId(folderId!),
    enabled: !!folderId && !!user?.id,
    staleTime: 30000, // 30 segundos
  });
};

/**
 * Hook para obtener un archivo por su ID del usuario actual
 * @param id - ID del archivo
 */
export const useFileById = (id: string | null) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['files', id, user?.id],
    queryFn: () => fileService.getFileById(id!, user?.id),
    enabled: !!id && !!user, // Solo ejecutar si hay un ID y un usuario autenticado
  });
};

/**
 * Hook para subir un archivo del usuario actual
 */
export const useUploadFile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: ({ file, fileData }: { 
      file: { id: string; filename: string; folder_id: string; storage_path?: string; created_at?: string; is_shared?: boolean }; 
      fileData: Blob 
    }) => fileService.uploadFile(file, fileData, user?.id),
    onSuccess: (newFile) => {
      // Invalidar consultas para actualizar la UI
      queryClient.invalidateQueries({ 
        queryKey: ['files', 'folder', newFile.folder_id, user?.id] 
      });
    },
  });
};

/**
 * Hook para actualizar un archivo del usuario actual
 */
export const useUpdateFile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: FileUpdate }) => 
      fileService.updateFile(id, file, user?.id),
    onSuccess: (updatedFile) => {
      // Invalidar consultas para actualizar la UI
      queryClient.invalidateQueries({ 
        queryKey: ['files', 'folder', updatedFile.folder_id, user?.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['files', updatedFile.id, user?.id] 
      });
    },
  });
};

/**
 * Hook para mover un archivo a la papelera (soft delete)
 */
export const useDeleteFile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (file: File) => fileService.moveToTrash(file.id, user?.id),
    onSuccess: (_, file) => {
      // Invalidar consultas para actualizar la UI
      queryClient.invalidateQueries({ 
        queryKey: ['files', 'folder', file.folder_id, user?.id] 
      });
      // También invalidar la consulta de trash para que aparezca allí
      queryClient.invalidateQueries({ 
        queryKey: ['trash', 'files', user?.id] 
      });
    },
  });
};

/**
 * Hook para obtener la URL pública de un archivo
 * @param storagePath - Ruta del archivo en el storage
 */
export const useFilePublicUrl = (storagePath: string | null) => {
  return {
    publicUrl: storagePath ? fileService.getPublicUrl(storagePath) : null
  };
};

/**
 * Hook para renombrar un archivo del usuario actual
 */
export const useRenameFile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: ({ fileId, newFilename }: { fileId: string; newFilename: string }) => {
      // Usar 'name' que es el campo real en la base de datos
      return fileService.updateFile(fileId, { name: newFilename } as any, user?.id);
    },
    onSuccess: (updatedFile) => {
      // Invalidar consultas para actualizar la UI
      queryClient.invalidateQueries({ 
        queryKey: ['files', 'folder', updatedFile.folder_id, user?.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['files', updatedFile.id, user?.id] 
      });
    },
  });
};

/**
 * Hook para cambiar el estado de compartición de un archivo
 */
export const useToggleFileSharing = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: ({ fileId, isShared }: { fileId: string; isShared: boolean }) => 
      fileService.toggleFileSharing(fileId, isShared, user?.id!),
    onSuccess: (updatedFile) => {
      // Invalidar consultas para actualizar la UI
      queryClient.invalidateQueries({ 
        queryKey: ['files', 'folder', updatedFile?.folder_id, user?.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['files', updatedFile?.id, user?.id] 
      });
    },
  });
};
