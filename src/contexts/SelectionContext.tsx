import React, { createContext, useContext, useState, useCallback } from 'react';

export interface SelectableItem {
  id: string;
  type: 'file' | 'folder';
  name: string;
}

export type SelectionState = 'none' | 'partial' | 'all';

interface SelectionContextType {
  selectedItems: SelectableItem[];
  isSelected: (id: string) => boolean;
  toggleSelection: (item: SelectableItem) => void;
  selectMultiple: (items: SelectableItem[]) => void;
  clearSelection: () => void;
  selectAll: (items: SelectableItem[]) => void;
  deselectAll: () => void;
  toggleSelectAll: (items: SelectableItem[]) => void;
  getSelectionState: (items: SelectableItem[]) => SelectionState;
  hasSelection: boolean;
  selectedCount: number;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export const SelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedItems, setSelectedItems] = useState<SelectableItem[]>([]);

  const isSelected = useCallback((id: string) => {
    return selectedItems.some(item => item.id === id);
  }, [selectedItems]);

  const toggleSelection = useCallback((item: SelectableItem) => {
    setSelectedItems(prev => {
      const isCurrentlySelected = prev.some(selected => selected.id === item.id);
      
      if (isCurrentlySelected) {
        return prev.filter(selected => selected.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  }, []);

  const selectMultiple = useCallback((items: SelectableItem[]) => {
    setSelectedItems(prev => {
      const newItems = items.filter(item => 
        !prev.some(selected => selected.id === item.id)
      );
      return [...prev, ...newItems];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const selectAll = useCallback((items: SelectableItem[]) => {
    setSelectedItems([...items]);
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const toggleSelectAll = useCallback((items: SelectableItem[]) => {
    setSelectedItems(prev => {
      // Calculate selection state based on current state
      const selectedIds = new Set(prev.map(item => item.id));
      const selectedCount = items.filter(item => selectedIds.has(item.id)).length;
      const isAllSelected = selectedCount === items.length;
      
      if (isAllSelected) {
        // Si todos están seleccionados, deseleccionar todos
        return prev.filter(selected => 
          !items.some(item => item.id === selected.id)
        );
      } else {
        // Si ninguno o algunos están seleccionados, seleccionar todos
        const existingIds = new Set(prev.map(item => item.id));
        const newItems = items.filter(item => !existingIds.has(item.id));
        return [...prev, ...newItems];
      }
    });
  }, []);

  const getSelectionState = useCallback((items: SelectableItem[]): SelectionState => {
    if (!items.length) return 'none';
    
    const selectedIds = new Set(selectedItems.map(item => item.id));
    const selectedCount = items.filter(item => selectedIds.has(item.id)).length;
    
    if (selectedCount === 0) return 'none';
    if (selectedCount === items.length) return 'all';
    return 'partial';
  }, [selectedItems]);

  const hasSelection = selectedItems.length > 0;
  const selectedCount = selectedItems.length;

  const value = {
    selectedItems,
    isSelected,
    toggleSelection,
    selectMultiple,
    clearSelection,
    selectAll,
    deselectAll,
    toggleSelectAll,
    getSelectionState,
    hasSelection,
    selectedCount
  };

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
};
