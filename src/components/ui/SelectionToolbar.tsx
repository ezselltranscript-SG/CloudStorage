import React, { useState } from 'react';
import { Move, Trash2, Share, X } from 'lucide-react';
import { Button } from './Button';
import { FolderPicker } from './FolderPicker';
import { useSelection } from '../../contexts/SelectionContext';
import { useMove } from '../../hooks/useMove';

export const SelectionToolbar: React.FC = () => {
  const { selectedItems, clearSelection, selectedCount } = useSelection();
  const { moveItems, isMoving } = useMove();
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

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log('Delete selected items:', selectedItems);
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
            disabled={isMoving}
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
            <Share className="w-4 h-4" />
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
