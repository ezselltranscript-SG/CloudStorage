import React, { createContext, useContext, useState, useCallback } from 'react';

export interface SelectableItem {
  id: string;
  type: 'file' | 'folder';
  name: string;
}

interface SelectionContextType {
  selectedItems: SelectableItem[];
  isSelected: (id: string) => boolean;
  toggleSelection: (item: SelectableItem) => void;
  selectMultiple: (items: SelectableItem[]) => void;
  clearSelection: () => void;
  selectAll: (items: SelectableItem[]) => void;
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
    setSelectedItems(items);
  }, []);

  const hasSelection = selectedItems.length > 0;
  const selectedCount = selectedItems.length;

  const value = {
    selectedItems,
    isSelected,
    toggleSelection,
    selectMultiple,
    clearSelection,
    selectAll,
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
