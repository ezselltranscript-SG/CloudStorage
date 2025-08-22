import React, { useState, useRef } from 'react';
import { MoreHorizontal, Download, Trash2, ExternalLink, Share2, Pencil, Move } from 'lucide-react';
import { formatFileSize, getFileIcon } from '../../types/file';
import { ShareToggleButton } from './ShareToggleButton';
import { useSelection } from '../../contexts/SelectionContext';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils/cn';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { Portal } from '../ui/Portal';
import { getFileTypeDisplayName } from '../../utils/file-type-utils';

interface FileItemProps {
  file: {
    id: string;
    name: string;
    folder_id: string;
    storage_path: string;
    size: number;
    mimetype: string;
    created_at: string;
    user_id: string;
    is_shared: boolean;
    deleted_at: string | null;
  };
  onRename?: (file: any) => void;
  onDelete?: (file: any) => void;
  onDownload?: (file: any) => void;
  onPreview?: (file: any) => void;
  onShare?: (file: any) => void;
  onMove?: (file: any) => void;
  className?: string;
}

export const FileItem: React.FC<FileItemProps> = ({
  file,
  onRename,
  onDelete,
  onDownload,
  onPreview,
  onShare,
  onMove,
  className,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { user } = useAuth();
  const { isSelected, toggleSelection } = useSelection();
  const { handleDragStart, handleDragEnd, draggedItems } = useDragAndDrop();
  const isBeingDragged = draggedItems.some(item => item.id === file.id);
  
  const FileIconComponent = getFileIcon(file.mimetype);

  const handleCheckboxChange = () => {
    toggleSelection({
      id: file.id,
      type: 'file',
      name: file.name
    });
  };

  const closeMenu = () => setIsMenuOpen(false);

  // Close menu when clicking outside
  useOnClickOutside(menuRef as React.RefObject<HTMLElement>, closeMenu);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMenuOpen && buttonRef.current) {
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
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div
      className={cn(
        "group grid grid-cols-12 items-center px-4 py-2.5 border-b border-slate-100 hover:bg-slate-50 transition relative",
        isMenuOpen ? 'ring-1 ring-blue-300 z-10 bg-blue-50' : '',
        isSelected(file.id) ? 'bg-blue-50 border-blue-200' : '',
        isBeingDragged ? 'opacity-50' : '',
        className
      )}
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        handleDragStart({
          id: file.id,
          type: 'file',
          name: file.name
        });
      }}
      onDragEnd={handleDragEnd}
    >
      {/* Checkbox y nombre e icono */}
      <div className="col-span-6 flex items-center gap-3 min-w-0">
        <input
          type="checkbox"
          checked={isSelected(file.id)}
          onChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
        />
        <div className="flex-shrink-0 p-1.5 bg-slate-100 rounded">
          <FileIconComponent className="h-4 w-4 text-slate-500" />
        </div>
        <div 
          className="min-w-0 flex-1 cursor-pointer"
          onClick={() => onPreview && onPreview(file)}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-900 truncate">{file.name}</span>
            {file.is_shared && file.user_id !== user?.id && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                Shared
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{getFileTypeDisplayName(file.mimetype) || 'File'}</div>
        </div>
      </div>
      
      {/* Fecha de modificación */}
      <div className="col-span-2 text-xs text-slate-500">
        {new Date(file.created_at).toLocaleDateString()}
      </div>
      
      {/* Tamaño de archivo */}
      <div className="col-span-2 text-xs text-slate-500">
        {file.size ? formatFileSize(file.size) : '-'}
      </div>
      
      {/* Acciones */}
      <div className="col-span-2 flex justify-end gap-1 relative">
        <ShareToggleButton 
          item={{ 
            id: file.id, 
            is_shared: file.is_shared, 
            user_id: file.user_id,
            name: file.name
          }}
          type="file"
          currentUserId={user?.id}
        />
        
        <button
          onClick={() => onPreview && onPreview(file)}
          className="p-1.5 rounded-md hover:bg-slate-200 transition-colors group"
          title="Preview"
        >
          <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
        </button>
        
        <button
          onClick={() => onDownload && onDownload(file)}
          className="p-1.5 rounded-md hover:bg-slate-200 transition-colors group"
          title="Download"
        >
          <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
        </button>
        
        <div ref={menuRef} className="relative">
          <button
            ref={buttonRef}
            className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-slate-200 transition-colors focus:outline-none"
            onClick={handleMenuToggle}
            title="More options"
          >
            <MoreHorizontal className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
          </button>
          
          {/* Menu contextual */}
          {isMenuOpen && (
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
              onClick={(e) => {
                e.stopPropagation();
                onMove && onMove(file);
                closeMenu();
              }}
              className="flex w-full items-center px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              <Move className="h-3.5 w-3.5 mr-2 text-slate-500" />
              Move to...
            </button>
            
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare && onShare(file);
                  closeMenu();
                }}
                className="flex w-full items-center px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                <Share2 className="h-3.5 w-3.5 mr-2 text-slate-500" />
                Share
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRename && onRename(file);
                  closeMenu();
                }}
                className="flex w-full items-center px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="h-3.5 w-3.5 mr-2 text-slate-500" />
                Rename
              </button>
              
              <div className="border-t border-slate-100 my-1"></div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete && onDelete(file);
                  closeMenu();
                }}
                className="flex w-full items-center px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2 text-red-500" />
                Delete
              </button>
              </div>
            </Portal>
          )}
        </div>
      </div>
    </div>
  );
};
