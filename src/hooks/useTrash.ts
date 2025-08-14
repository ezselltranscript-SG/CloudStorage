import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fileService } from '../services/supabase/file-service';
import { folderService } from '../services/supabase/folder-service';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para obtener archivos en la papelera del usuario actual
 */
export const useTrashFiles = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['trash', 'files', user?.id],
    queryFn: () => fileService.getTrashFiles(user?.id),
    enabled: !!user,
  });
};

/**
 * Hook para obtener carpetas en la papelera del usuario actual
 */
export const useTrashFolders = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['trash', 'folders', user?.id],
    queryFn: () => folderService.getTrashFolders(user?.id),
    enabled: !!user,
  });
};

/**
 * Hook para mover un archivo a la papelera
 */
export const useMoveFileToTrash = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (fileId: string) => fileService.moveToTrash(fileId, user?.id),
    onSuccess: (deletedFile) => {
      // Invalidar consultas para actualizar la UI
      queryClient.invalidateQueries({ 
        queryKey: ['files', 'folder', deletedFile?.folder_id, user?.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['trash', 'files', user?.id] 
      });
    },
  });
};

/**
 * Hook para mover una carpeta a la papelera
 */
export const useMoveFolderToTrash = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (folderId: string) => folderService.moveToTrash(folderId, user?.id),
    onSuccess: (deletedFolder) => {
      // Invalidar consultas para actualizar la UI
      queryClient.invalidateQueries({ 
        queryKey: ['folders', 'parent', deletedFolder?.parent_id, user?.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['trash', 'folders', user?.id] 
      });
    },
  });
};

/**
 * Hook para restaurar un archivo desde la papelera
 */
export const useRestoreFileFromTrash = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (fileId: string) => fileService.restoreFromTrash(fileId, user?.id),
    onSuccess: (restoredFile) => {
      // Invalidar consultas para actualizar la UI
      queryClient.invalidateQueries({ 
        queryKey: ['files', 'folder', restoredFile?.folder_id, user?.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['trash', 'files', user?.id] 
      });
    },
  });
};

/**
 * Hook para restaurar una carpeta desde la papelera
 */
export const useRestoreFolderFromTrash = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (folderId: string) => folderService.restoreFromTrash(folderId, user?.id),
    onSuccess: (restoredFolder) => {
      // Invalidar consultas para actualizar la UI
      queryClient.invalidateQueries({ 
        queryKey: ['folders', 'parent', restoredFolder?.parent_id, user?.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['trash', 'folders', user?.id] 
      });
    },
  });
};

/**
 * Hook para eliminar permanentemente un archivo
 */
export const usePermanentDeleteFile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (fileId: string) => fileService.permanentDelete(fileId, user?.id),
    onSuccess: () => {
      // Invalidar consultas para actualizar la UI
      queryClient.invalidateQueries({ 
        queryKey: ['trash', 'files', user?.id] 
      });
    },
  });
};

/**
 * Hook para eliminar permanentemente una carpeta
 */
export const usePermanentDeleteFolder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (folderId: string) => folderService.permanentDelete(folderId, user?.id),
    onSuccess: () => {
      // Invalidar consultas para actualizar la UI
      queryClient.invalidateQueries({ 
        queryKey: ['trash', 'folders', user?.id] 
      });
    },
  });
};

/**
 * Hook para vaciar completamente la papelera
 */
export const useEmptyTrash = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async () => {
      // Obtener todos los archivos y carpetas en trash
      const [trashFiles, trashFolders] = await Promise.all([
        fileService.getTrashFiles(user?.id),
        folderService.getTrashFolders(user?.id)
      ]);
      
      // Eliminar permanentemente todos los archivos
      const filePromises = trashFiles.map(file => 
        fileService.permanentDelete(file.id, user?.id)
      );
      
      // Eliminar permanentemente todas las carpetas
      const folderPromises = trashFolders.map(folder => 
        folderService.permanentDelete(folder.id, user?.id)
      );
      
      await Promise.all([...filePromises, ...folderPromises]);
      
      return { deletedFiles: trashFiles.length, deletedFolders: trashFolders.length };
    },
    onSuccess: () => {
      // Invalidar consultas para actualizar la UI
      queryClient.invalidateQueries({ 
        queryKey: ['trash', 'files', user?.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['trash', 'folders', user?.id] 
      });
    },
  });
};
