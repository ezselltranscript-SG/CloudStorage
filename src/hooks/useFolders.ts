import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { folderService } from '../services/supabase/folder-service';
import type { Folder, FolderInsert, FolderUpdate } from '../services/supabase/folder-service';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para obtener todas las carpetas del usuario actual
 */
export const useAllFolders = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['folders', user?.id],
    queryFn: () => folderService.getAllFolders(user?.id),
    enabled: !!user, // Solo ejecutar si hay un usuario autenticado
  });
};

/**
 * Hook para obtener las carpetas por ID de carpeta padre del usuario actual
 * @param parentId - ID de la carpeta padre (null para carpetas raíz)
 */
export const useFoldersByParentId = (parentId: string | null) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['folders', 'parent', parentId, user?.id],
    queryFn: () => folderService.getFoldersByParentId(parentId, user?.id),
    enabled: !!user, // Solo ejecutar si hay un usuario autenticado
  });
};

/**
 * Hook para obtener una carpeta por su ID del usuario actual
 * @param id - ID de la carpeta
 */
export const useFolderById = (id: string | null) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['folders', id, user?.id],
    queryFn: () => folderService.getFolderById(id!, user?.id),
    enabled: !!id && !!user, // Solo ejecutar si hay un ID y un usuario autenticado
  });
};

/**
 * Hook para crear una carpeta para el usuario actual
 */
export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (folder: FolderInsert) => folderService.createFolder(folder, user?.id),
    onSuccess: (newFolder) => {
      // Invalidar consultas para actualizar la UI
      queryClient.invalidateQueries({ queryKey: ['folders', user?.id] });
      queryClient.invalidateQueries({ 
        queryKey: ['folders', 'parent', newFolder.parent_id, user?.id] 
      });
    },
  });
};

/**
 * Hook para actualizar una carpeta del usuario actual
 */
export const useUpdateFolder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: ({ id, folder }: { id: string; folder: FolderUpdate }) => 
      folderService.updateFolder(id, folder, user?.id),
    onSuccess: (updatedFolder) => {
      // Invalidar consultas para actualizar la UI
      queryClient.invalidateQueries({ queryKey: ['folders', user?.id] });
      queryClient.invalidateQueries({ 
        queryKey: ['folders', 'parent', updatedFolder.parent_id, user?.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['folders', updatedFolder.id, user?.id] 
      });
    },
  });
};

/**
 * Hook para eliminar una carpeta del usuario actual
 */
export const useDeleteFolder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (folder: Folder) => folderService.deleteFolder(folder.id, user?.id),
    onSuccess: (_, folder) => {
      // Invalidar consultas para actualizar la UI
      queryClient.invalidateQueries({ queryKey: ['folders', user?.id] });
      queryClient.invalidateQueries({ 
        queryKey: ['folders', 'parent', folder.parent_id, user?.id] 
      });
    },
  });
};
