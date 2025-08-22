import React, { useEffect, useRef } from 'react';
import { useSelection, type SelectableItem } from '../../contexts/SelectionContext';

interface SelectAllCheckboxProps {
  items: SelectableItem[];
  className?: string;
}

export const SelectAllCheckbox: React.FC<SelectAllCheckboxProps> = ({ 
  items, 
  className = '' 
}) => {
  const { toggleSelectAll, getSelectionState } = useSelection();
  const checkboxRef = useRef<HTMLInputElement>(null);
  
  const selectionState = getSelectionState(items);
  
  // Update checkbox visual state
  useEffect(() => {
    if (checkboxRef.current) {
      if (selectionState === 'partial') {
        checkboxRef.current.indeterminate = true;
        checkboxRef.current.checked = false;
      } else {
        checkboxRef.current.indeterminate = false;
        checkboxRef.current.checked = selectionState === 'all';
      }
    }
  }, [selectionState]);

  const handleToggle = () => {
    toggleSelectAll(items);
  };

  const isDisabled = items.length === 0;

  return (
    <div className={`flex items-center ${className}`}>
      <input
        ref={checkboxRef}
        type="checkbox"
        disabled={isDisabled}
        onChange={handleToggle}
        className={`
          h-4 w-4 rounded border-gray-300 text-blue-600 
          focus:ring-blue-500 focus:ring-2 focus:ring-offset-0
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label={
          selectionState === 'all' 
            ? 'Deselect all items' 
            : selectionState === 'partial'
            ? 'Select all items (some selected)'
            : 'Select all items'
        }
      />
    </div>
  );
};
