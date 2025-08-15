import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fileService } from '../services/supabase/file-service';
import { folderService } from '../services/supabase/folder-service';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { SelectableItem } from '../contexts/SelectionContext';

interface MoveItemsParams {
  items: SelectableItem[];
  destinationFolderId: string | null;
}

export const useMove = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const moveItemsMutation = useMutation({
    mutationFn: async ({ items, destinationFolderId }: MoveItemsParams) => {
      if (!user) throw new Error('User not authenticated');

      const fileIds = items.filter(item => item.type === 'file').map(item => item.id);
      const folderIds = items.filter(item => item.type === 'folder').map(item => item.id);

      const results = {
        files: { moved: [] as any[], errors: [] as any[], success: true },
        folders: { moved: [] as any[], errors: [] as any[], success: true }
      };

      // Move files
      if (fileIds.length > 0) {
        results.files = await fileService.moveMultipleFiles(fileIds, destinationFolderId, user.id);
      }

      // Move folders
      if (folderIds.length > 0) {
        results.folders = await folderService.moveMultipleFolders(folderIds, destinationFolderId, user.id);
      }

      return results;
    },
    onSuccess: (results) => {
      const totalMoved = results.files.moved.length + results.folders.moved.length;
      const totalErrors = results.files.errors.length + results.folders.errors.length;

      if (totalErrors === 0) {
        showSuccess(`Successfully moved ${totalMoved} item${totalMoved !== 1 ? 's' : ''}`);
      } else {
        showError(`Moved ${totalMoved} items, but ${totalErrors} failed`);
      }

      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
    onError: (error: any) => {
      showError(`Failed to move items: ${error.message}`);
    }
  });

  const moveSingleItem = async (item: SelectableItem, destinationFolderId: string | null) => {
    if (!user) throw new Error('User not authenticated');

    try {
      if (item.type === 'file') {
        await fileService.moveFile(item.id, destinationFolderId, user.id);
      } else {
        await folderService.moveFolder(item.id, destinationFolderId, user.id);
      }

      showSuccess(`Successfully moved ${item.name}`);
      
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    } catch (error: any) {
      showError(`Failed to move ${item.name}: ${error.message}`);
      throw error;
    }
  };

  return {
    moveItems: moveItemsMutation.mutate,
    moveSingleItem,
    isMoving: moveItemsMutation.isPending
  };
};
