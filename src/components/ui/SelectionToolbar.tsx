import React, { useState } from 'react';
import { X, Move, Share2, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { FolderPicker } from './FolderPicker';
import { useSelection } from '../../contexts/SelectionContext';
import { useMoveFileToTrash, useMoveFolderToTrash } from '../../hooks/useTrash';
import { useMove } from '../../hooks/useMove';
import { useToast } from '../../contexts/ToastContext';

interface SelectionToolbarProps {
  onMove?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = () => {
  const { selectedItems, clearSelection, selectedCount } = useSelection();
  const moveFileToTrash = useMoveFileToTrash();
  const moveFolderToTrash = useMoveFolderToTrash();
  const { moveItems, isMoving } = useMove();
  const { showSuccess, showError } = useToast();
  const [showFolderPicker, setShowFolderPicker] = useState(false);

  if (!selectedItems.length) return null;

  const handleMoveClick = () => {
    setShowFolderPicker(true);
  };

  const handleMoveConfirm = (destinationFolderId: string | null) => {
    moveItems({ 
      items: selectedItems, 
      destinationFolderId 
    });
    clearSelection();
    setShowFolderPicker(false);
  };

  const handleDelete = async () => {
    try {
      const fileItems = selectedItems.filter(item => item.type === 'file');
      const folderItems = selectedItems.filter(item => item.type === 'folder');

      // Move files to trash
      for (const file of fileItems) {
        await moveFileToTrash.mutateAsync(file.id);
      }

      // Move folders to trash
      for (const folder of folderItems) {
        await moveFolderToTrash.mutateAsync(folder.id);
      }

      showSuccess('Items moved to trash successfully');
      clearSelection();
    } catch (error) {
      console.error('Error moving items to trash:', error);
      showError('Failed to move items to trash');
    }
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share selected items:', selectedItems);
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 flex items-center space-x-3 z-40">
        <span className="text-sm text-gray-600 font-medium">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </span>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleMoveClick}
            disabled={isMoving || moveFileToTrash.isPending || moveFolderToTrash.isPending}
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
          >
            <Move className="w-4 h-4" />
            <span>Move to...</span>
          </Button>
          
          <Button
            onClick={handleShare}
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </Button>
          
          <Button
            onClick={handleDelete}
            variant="outline"
            size="sm"
            className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:border-red-300"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </Button>
          
          <Button
            onClick={clearSelection}
            variant="ghost"
            size="sm"
            className="flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <FolderPicker
        isOpen={showFolderPicker}
        onClose={() => setShowFolderPicker(false)}
        onSelect={handleMoveConfirm}
        title="Move items to..."
      />
    </>
  );
};
