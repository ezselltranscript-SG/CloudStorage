import React, { useState, useRef } from 'react';
import { Folder, MoreHorizontal, Pencil, Trash2, Move, Download } from 'lucide-react';
import type { Folder as FolderType } from '../../services/supabase/folder-service';
import { cn } from '../../lib/utils/cn';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { Portal } from '../ui/Portal';
import { ShareToggleButton } from './ShareToggleButton';
import { useAuth } from '../../contexts/AuthContext';
import { useSelection } from '../../contexts/SelectionContext';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';

interface FolderItemProps {
  folder: FolderType;
  onClick: () => void;
  className?: string;
  onRename?: (folder: FolderType) => void;
  onDelete?: (folder: FolderType) => void;
  onMove?: (folder: FolderType) => void;
  onDownload?: (folder: FolderType) => void;
}

export const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  onClick,
  className,
  onRename,
  onDelete,
  onMove,
  onDownload,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { user } = useAuth();
  const { isSelected, toggleSelection } = useSelection();
  const { handleDragStart, handleDragEnd, handleDragOver, handleDragLeave, handleDrop, draggedItems, dragOverTarget, canDropOnTarget } = useDragAndDrop();
  
  const isItemSelected = isSelected(folder.id);
  const isBeingDragged = draggedItems.some(item => item.id === folder.id);
  const isDraggedOver = dragOverTarget === folder.id;
  const canDrop = canDropOnTarget(folder.id);
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    toggleSelection({
      id: folder.id,
      type: 'folder',
      name: folder.name
    });
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  // We fix the type error using a type assertion for the ref
  useOnClickOutside(menuRef as React.RefObject<HTMLElement>, () => setMenuOpen(false));

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!menuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 176; // w-44 = 11rem = 176px
      const dropdownHeight = 200;
      
      let top = rect.bottom + 4; // Default: below button
      let left = rect.right - dropdownWidth; // Align to right edge
      
      // Check if dropdown would go below viewport
      if (top + dropdownHeight > window.innerHeight) {
        top = rect.top - dropdownHeight - 4; // Show above
      }
      
      // Check if dropdown would go outside left edge
      if (left < 8) {
        left = 8;
      }
      
      setDropdownPosition({ top, left });
    }
    setMenuOpen(!menuOpen);
  };
  return (
    <div
      className={cn(
        "group grid grid-cols-12 items-center px-4 py-2.5 border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer relative",
        menuOpen ? 'ring-1 ring-blue-300 z-10 bg-blue-50' : '',
        isItemSelected ? 'bg-blue-50 border-blue-200' : '',
        isBeingDragged ? 'opacity-50' : '',
        isDraggedOver && canDrop ? 'bg-green-50 border-green-200' : '',
        className
      )}
      onClick={onClick}
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        handleDragStart({
          id: folder.id,
          type: 'folder',
          name: folder.name
        });
      }}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => {
        e.stopPropagation();
        if (canDrop) {
          handleDragOver(e, folder.id);
        }
      }}
      onDragLeave={(e) => {
        e.stopPropagation();
        handleDragLeave();
      }}
      onDrop={(e) => {
        e.stopPropagation();
        if (canDrop) {
          handleDrop(e, folder.id);
        }
      }}
    >
      {/* Checkbox, Icon and name */}
      <div className="col-span-6 flex items-center gap-3 min-w-0">
        <input
          type="checkbox"
          checked={isItemSelected}
          onChange={handleCheckboxChange}
          onClick={handleCheckboxClick}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
        />
        <div className="p-1.5 bg-blue-50 rounded-md">
          <Folder className="h-4 w-4 text-blue-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="font-medium text-slate-800 truncate">{folder.name}</div>
            {folder.is_shared && folder.user_id !== user?.id && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                Shared
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Folder</div>
        </div>
      </div>
      {/* Creation/modification date */}
      <div className="col-span-2 text-xs text-slate-500">
        {new Date(folder.created_at).toLocaleDateString()}
      </div>
      {/* Type (always Folder) */}
      <div className="col-span-2 text-xs text-slate-500">-</div>
      {/* Actions */}
      <div className="col-span-2 flex justify-end items-center gap-1 relative">
        <ShareToggleButton 
          item={{ 
            id: folder.id, 
            is_shared: folder.is_shared, 
            user_id: folder.user_id,
            name: folder.name
          }}
          type="folder"
          currentUserId={user?.id}
        />
        
        <div ref={menuRef} className="relative">
          <button
            ref={buttonRef}
            className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-slate-200 transition-colors focus:outline-none"
            onClick={handleMenuToggle}
            aria-label="Folder options"
          >
            <MoreHorizontal className="h-3.5 w-3.5 text-slate-500" />
          </button>
          {menuOpen && (
            <Portal>
              <div 
                ref={menuRef}
                className="fixed w-44 rounded-md shadow-xl bg-white border border-slate-200 py-1" 
                style={{ 
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  zIndex: 99999 
                }}
              >
              <button
                className="flex w-full items-center px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                onClick={e => {
                  e.stopPropagation();
                  onMove?.(folder);
                  setMenuOpen(false);
                }}
              >
                <Move className="h-3.5 w-3.5 mr-2 text-slate-500" />
                <span>Move to...</span>
              </button>
              
              <button
                className="flex w-full items-center px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                onClick={e => {
                  e.stopPropagation();
                  onDownload?.(folder);
                  setMenuOpen(false);
                }}
              >
                <Download className="h-3.5 w-3.5 mr-2 text-slate-500" />
                <span>Download as ZIP</span>
              </button>
              
              <button
                className="flex w-full items-center px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                onClick={e => {
                  e.stopPropagation();
                  onRename?.(folder);
                  setMenuOpen(false);
                }}
              >
                <Pencil className="h-3.5 w-3.5 mr-2 text-slate-500" />
                <span>Rename</span>
              </button>
              <div className="border-t border-slate-100 my-1"></div>
              <button
                className="flex w-full items-center px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                onClick={e => {
                  e.stopPropagation();
                  onDelete?.(folder);
                  setMenuOpen(false);
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2 text-red-500" />
                <span>Delete</span>
              </button>
              </div>
            </Portal>
          )}
        </div>
      </div>
    </div>
  );
};
