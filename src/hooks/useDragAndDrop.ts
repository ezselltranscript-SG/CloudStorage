import { useState, useCallback } from 'react';
import { useMove } from './useMove';
import { useSelection } from '../contexts/SelectionContext';
import { useToast } from '../contexts/ToastContext';

export interface DragItem {
  id: string;
  type: 'file' | 'folder';
  name: string;
}

export const useDragAndDrop = () => {
  const [draggedItems, setDraggedItems] = useState<DragItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  
  const { selectedItems, clearSelection } = useSelection();
  const { moveItems } = useMove();
  const { showSuccess, showError } = useToast();

  const handleDragStart = useCallback((item: DragItem) => {
    // If the item being dragged is selected, drag all selected items
    // Otherwise, just drag the single item
    const itemsToMove = selectedItems.some(selected => selected.id === item.id)
      ? selectedItems
      : [item];
    
    setDraggedItems(itemsToMove);
    setIsDragging(true);
  }, [selectedItems]);

  const handleDragEnd = useCallback(() => {
    setDraggedItems([]);
    setIsDragging(false);
    setDragOverTarget(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget(targetFolderId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverTarget(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    
    if (draggedItems.length === 0) return;

    try {
      // Prevent moving items into themselves or their descendants
      const folderIds = draggedItems
        .filter(item => item.type === 'folder')
        .map(item => item.id);
      
      if (targetFolderId && folderIds.includes(targetFolderId)) {
        showError('Invalid Move', 'Cannot move a folder into itself or its descendants.');
        return;
      }

      await moveItems({
        items: draggedItems,
        destinationFolderId: targetFolderId
      });
      
      const itemCount = draggedItems.length;
      const itemType = itemCount === 1 ? draggedItems[0].type : 'items';
      showSuccess(`Moved ${itemCount} ${itemType} successfully`);
      
      // Clear selection after successful move
      clearSelection();
    } catch (error) {
      console.error('Error moving items:', error);
      showError('Move Failed', 'Failed to move the selected items. Please try again.');
    } finally {
      handleDragEnd();
    }
  }, [draggedItems, moveItems, showSuccess, showError, clearSelection]);

  const canDropOnTarget = useCallback((targetFolderId: string | null) => {
    if (!isDragging || draggedItems.length === 0) return false;
    
    // Don't allow dropping on the same folder or on dragged folders themselves
    return !draggedItems.some(item => 
      item.type === 'folder' && item.id === targetFolderId
    );
  }, [isDragging, draggedItems]);

  return {
    isDragging,
    draggedItems,
    dragOverTarget,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    canDropOnTarget,
  };
};
