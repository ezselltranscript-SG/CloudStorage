import React, { useState } from 'react';
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
  
  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };
  
  return (
    <div className="folder-node">
      <div 
        className={cn(
          "flex items-center py-1 px-2 rounded-md cursor-pointer text-sm",
          selectedFolderId === folder.id ? "bg-blue-100 text-blue-700" : "hover:bg-slate-100"
        )}
        style={{ paddingLeft: `${(level * 12) + 8}px` }}
        onClick={() => onFolderSelect(folder.id)}
      >
        {hasChildren ? (
          <button 
            onClick={toggleOpen}
            className="mr-1 p-0.5 rounded-sm hover:bg-slate-200 focus:outline-none"
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-500" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <FolderIcon className="h-4 w-4 text-blue-500 mr-2" />
        <span className="truncate">{folder.name}</span>
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
  const { data: folders = [] } = useAllFolders();
  const rootFolders = folders.filter(folder => folder.parent_id === null);
  
  return (
    <div className="folder-tree p-2">
      <div 
        className={cn(
          "flex items-center py-1 px-2 rounded-md cursor-pointer text-sm mb-1",
          selectedFolderId === null ? "bg-blue-100 text-blue-700" : "hover:bg-slate-100"
        )}
        onClick={() => onFolderSelect(null)}
      >
        <FolderIcon className="h-4 w-4 text-blue-500 mr-2" />
        <span className="font-medium">My Files</span>
      </div>
      
      {rootFolders.map(folder => (
        <FolderNode
          key={folder.id}
          folder={folder}
          level={0}
          selectedFolderId={selectedFolderId}
          onFolderSelect={onFolderSelect}
          allFolders={folders}
        />
      ))}
    </div>
  );
};
