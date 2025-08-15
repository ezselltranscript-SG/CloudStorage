import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder as FolderIcon } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import { useAllFolders } from '../../hooks/useFolders';
import type { Folder } from '../../services/supabase/folder-service';

interface FolderTreeProps {
  onFolderSelect: (folderId: string | null) => void;
  selectedFolderId: string | null;
}

interface FolderNodeProps {
  folder: Folder;
  level: number;
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string) => void;
  allFolders: Folder[];
}

const FolderNode: React.FC<FolderNodeProps> = ({ 
  folder, 
  level, 
  selectedFolderId, 
  onFolderSelect,
  allFolders
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const childFolders = allFolders.filter(f => f.parent_id === folder.id);
  const hasChildren = childFolders.length > 0;

  // Auto-expand if this folder or any child is selected
  useEffect(() => {
    const isSelectedOrHasSelectedChild = (folderId: string): boolean => {
      if (folderId === selectedFolderId) return true;
      const children = allFolders.filter(f => f.parent_id === folderId);
      return children.some(child => isSelectedOrHasSelectedChild(child.id));
    };

    if (selectedFolderId && isSelectedOrHasSelectedChild(folder.id)) {
      setIsOpen(true);
    }
  }, [selectedFolderId, folder.id, allFolders]);
  
  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };
  
  return (
    <div className="folder-node">
      <div 
        className={cn(
          "flex items-center py-1.5 px-2 rounded-md cursor-pointer text-sm transition-colors",
          selectedFolderId === folder.id 
            ? "bg-blue-50 text-blue-700 border border-blue-200" 
            : "hover:bg-slate-50 text-slate-700"
        )}
        style={{ paddingLeft: `${(level * 12) + 8}px` }}
        onClick={() => onFolderSelect(folder.id)}
      >
        {hasChildren ? (
          <button 
            onClick={toggleOpen}
            className="mr-1 p-0.5 rounded-sm hover:bg-slate-200 focus:outline-none transition-colors"
          >
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
            )}
          </button>
        ) : (
          <span className="w-4 mr-1" />
        )}
        <FolderIcon className={cn(
          "h-4 w-4 mr-2 flex-shrink-0",
          selectedFolderId === folder.id ? "text-blue-600" : "text-blue-500"
        )} />
        <span className="truncate font-medium">{folder.name}</span>
      </div>
      
      {isOpen && hasChildren && (
        <div className="folder-children">
          {childFolders.map(childFolder => (
            <FolderNode
              key={childFolder.id}
              folder={childFolder}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              onFolderSelect={onFolderSelect}
              allFolders={allFolders}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FolderTree: React.FC<FolderTreeProps> = ({ 
  onFolderSelect,
  selectedFolderId
}) => {
  const { data: folders = [], isLoading, error } = useAllFolders();
  const rootFolders = folders.filter(folder => folder.parent_id === null);
  
  if (isLoading) {
    return (
      <div className="folder-tree p-2">
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-slate-200 rounded"></div>
          <div className="h-6 bg-slate-200 rounded ml-4"></div>
          <div className="h-6 bg-slate-200 rounded ml-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="folder-tree p-2">
        <div className="text-sm text-red-500 px-2 py-1">
          Error loading folders
        </div>
      </div>
    );
  }
  
  return (
    <div className="folder-tree p-2">
      <div 
        className={cn(
          "flex items-center py-1.5 px-2 rounded-md cursor-pointer text-sm mb-1 transition-colors",
          selectedFolderId === null 
            ? "bg-blue-50 text-blue-700 border border-blue-200" 
            : "hover:bg-slate-50 text-slate-700"
        )}
        onClick={() => onFolderSelect(null)}
      >
        <FolderIcon className={cn(
          "h-4 w-4 mr-2 flex-shrink-0",
          selectedFolderId === null ? "text-blue-600" : "text-blue-500"
        )} />
        <span className="font-medium">My Files</span>
      </div>
      
      {rootFolders.length === 0 ? (
        <div className="text-xs text-slate-500 px-2 py-2">
          No folders yet
        </div>
      ) : (
        rootFolders.map(folder => (
          <FolderNode
            key={folder.id}
            folder={folder}
            level={0}
            selectedFolderId={selectedFolderId}
            onFolderSelect={onFolderSelect}
            allFolders={folders}
          />
        ))
      )}
    </div>
  );
};
