import React, { useState, useRef } from 'react';
import { MoreHorizontal, Download, Trash2, ExternalLink, Share2, Pencil } from 'lucide-react';
import { formatFileSize, getFileIcon } from '../../types/file';
import { ShareToggleButton } from './ShareToggleButton';
import { useAuth } from '../../contexts/AuthContext';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';

interface FileItemProps {
  file: {
    id: string;
    filename: string;
    folder_id: string;
    storage_path: string;
    size: number;
    mimetype: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    is_shared: boolean;
  };
  onRename?: (file: any) => void;
  onDelete?: (file: any) => void;
  onDownload?: (file: any) => void;
  onPreview?: (file: any) => void;
  onShare?: (file: any) => void;
}

export const FileItem: React.FC<FileItemProps> = ({
  file,
  onRename,
  onDelete,
  onDownload,
  onPreview,
  onShare,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useOnClickOutside(menuRef as React.RefObject<HTMLElement>, () => setIsMenuOpen(false));

  const FileIconComponent = getFileIcon(file.filename);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="grid grid-cols-12 items-center px-4 py-2.5 border-b border-slate-100 hover:bg-slate-50 transition-colors text-sm">
      {/* Nombre e icono */}
      <div className="col-span-6 flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 p-1.5 bg-slate-100 rounded">
          {FileIconComponent && <FileIconComponent className="h-4 w-4 text-slate-500" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="font-medium text-slate-800 truncate">{file.filename}</div>
            {file.is_shared && file.user_id !== user?.id && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                Shared
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{file.mimetype || 'File'}</div>
        </div>
      </div>
      
      {/* Fecha de modificación */}
      <div className="col-span-2 text-xs text-slate-500">
        {new Date(file.updated_at || file.created_at).toLocaleDateString()}
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
            filename: file.filename
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
        
        <div className="relative">
          <button
            onClick={toggleMenu}
            className="p-1.5 rounded-md hover:bg-slate-200 transition-colors group"
            title="More options"
          >
            <MoreHorizontal className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
          </button>
          
          {/* Menú contextual */}
          {isMenuOpen && (
            <div 
              ref={menuRef}
              className="fixed right-4 mt-1 w-44 rounded-md shadow-lg bg-white ring-1 ring-slate-200 z-[9999] py-1"
              style={{ top: menuRef.current ? `${menuRef.current.getBoundingClientRect().bottom + window.scrollY + 5}px` : 'auto' }}
            >
              <button
                onClick={() => {
                  onShare && onShare(file);
                  closeMenu();
                }}
                className="flex w-full items-center px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                <Share2 className="h-3.5 w-3.5 mr-2 text-slate-500" />
                Share
              </button>
              
              <button
                onClick={() => {
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
                onClick={() => {
                  onDelete && onDelete(file);
                  closeMenu();
                }}
                className="flex w-full items-center px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2 text-red-500" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
