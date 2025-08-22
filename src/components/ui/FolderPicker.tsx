import React, { useState, useEffect } from 'react';
import { X, Folder, FolderPlus, ChevronRight, ChevronDown, FileText, Files } from 'lucide-react';
import { Button } from './Button';
import { folderService, type Folder as FolderType } from '../../services/supabase/folder-service';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface FolderNode extends FolderType {
  children?: FolderNode[];
  expanded?: boolean;
}

interface FolderPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (folderId: string | null) => void;
  title?: string;
  excludeFolderIds?: string[]; // Carpetas a excluir (ej: la carpeta que se está moviendo)
  itemCount?: number; // Número de items a mover
  itemType?: 'files' | 'folders' | 'mixed'; // Tipo de items
}

export const FolderPicker: React.FC<FolderPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = "Move to...",
  excludeFolderIds = [],
  itemCount = 0,
  itemType = 'mixed'
}) => {
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    if (isOpen && user) {
      loadFolders();
    }
  }, [isOpen, user]);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const allFolders = await folderService.getAllFolders();
      
      // Filtrar carpetas excluidas
      const filteredFolders = allFolders.filter(folder => 
        !excludeFolderIds.includes(folder.id)
      );
      
      const folderTree = buildFolderTree(filteredFolders);
      setFolders(folderTree);
    } catch (error: any) {
      showError('Failed to load folders');
      console.error('Error loading folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildFolderTree = (folders: FolderType[]): FolderNode[] => {
    const folderMap = new Map<string, FolderNode>();
    const rootFolders: FolderNode[] = [];

    // Crear mapa de carpetas
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [], expanded: false });
    });

    // Construir árbol
    folders.forEach(folder => {
      const folderNode = folderMap.get(folder.id)!;
      
      if (folder.parent_id && folderMap.has(folder.parent_id)) {
        const parent = folderMap.get(folder.parent_id)!;
        parent.children!.push(folderNode);
      } else {
        rootFolders.push(folderNode);
      }
    });

    return rootFolders.sort((a, b) => a.name.localeCompare(b.name));
  };

  const toggleFolder = (folderId: string) => {
    setFolders(prev => toggleFolderExpansion(prev, folderId));
  };

  const toggleFolderExpansion = (folders: FolderNode[], targetId: string): FolderNode[] => {
    return folders.map(folder => {
      if (folder.id === targetId) {
        return { ...folder, expanded: !folder.expanded };
      }
      if (folder.children) {
        return {
          ...folder,
          children: toggleFolderExpansion(folder.children, targetId)
        };
      }
      return folder;
    });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !user) return;

    try {
      setCreatingFolder(true);
      await folderService.createFolder({
        name: newFolderName.trim(),
        parent_id: selectedFolderId
      }, user.id);
      
      setNewFolderName('');
      showSuccess('Folder created successfully');
      await loadFolders();
    } catch (error: any) {
      showError('Failed to create folder');
      console.error('Error creating folder:', error);
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleSelect = () => {
    onSelect(selectedFolderId);
    onClose();
  };

  const getSelectedFolderPath = (folderId: string | null): string => {
    if (!folderId) return 'My Files';
    
    const findFolderPath = (folders: FolderNode[], targetId: string, path: string[] = []): string[] | null => {
      for (const folder of folders) {
        const currentPath = [...path, folder.name];
        if (folder.id === targetId) {
          return currentPath;
        }
        if (folder.children) {
          const childPath = findFolderPath(folder.children, targetId, currentPath);
          if (childPath) return childPath;
        }
      }
      return null;
    };

    const path = findFolderPath(folders, folderId);
    return path ? `My Files > ${path.join(' > ')}` : 'My Files';
  };

  const getItemTypeIcon = () => {
    switch (itemType) {
      case 'files': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'folders': return <Folder className="w-4 h-4 text-blue-500" />;
      default: return <Files className="w-4 h-4 text-blue-500" />;
    }
  };

  const getItemTypeText = () => {
    if (itemCount === 1) {
      switch (itemType) {
        case 'files': return 'file';
        case 'folders': return 'folder';
        default: return 'item';
      }
    }
    return itemType === 'files' ? 'files' : itemType === 'folders' ? 'folders' : 'items';
  };

  const getButtonText = () => {
    const folderName = selectedFolderId ? 
      folders.find(f => f.id === selectedFolderId)?.name || 
      findFolderInTree(folders, selectedFolderId)?.name || 'Selected Folder'
      : 'My Files';
    return `Move to ${folderName}`;
  };

  const findFolderInTree = (folders: FolderNode[], targetId: string): FolderNode | null => {
    for (const folder of folders) {
      if (folder.id === targetId) return folder;
      if (folder.children) {
        const found = findFolderInTree(folder.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const renderFolder = (folder: FolderNode, level = 0) => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isSelected = selectedFolderId === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center py-2 cursor-pointer transition-colors ${
            isSelected 
              ? 'bg-blue-50 border-2 border-blue-300 rounded-md mx-2 shadow-sm' 
              : 'hover:bg-gray-50'
          }`}
          style={{ 
            paddingLeft: `${8 + (level * 20)}px`,
            paddingRight: '8px'
          }}
          onClick={() => setSelectedFolderId(folder.id)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="mr-2 p-0.5 rounded-sm hover:bg-gray-200 focus:outline-none transition-colors flex-shrink-0"
            >
              {folder.expanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
              )}
            </button>
          ) : (
            <div className="w-6 mr-2 flex-shrink-0" />
          )}
          <Folder className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
          <span className={`text-sm flex-1 ${
            isSelected ? 'font-semibold text-blue-700' : ''
          }`}>{folder.name}</span>
        </div>
        
        {hasChildren && folder.expanded && (
          <div>
            {folder.children!.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Context Header */}
        {itemCount > 0 && (
          <div className="bg-blue-50 border-b px-4 py-3">
            <div className="flex items-center space-x-2 text-sm">
              {getItemTypeIcon()}
              <span className="text-blue-700 font-medium">
                Moving {itemCount} {getItemTypeText()} to:
              </span>
              <span className="text-blue-900 font-semibold">
                {getSelectedFolderPath(selectedFolderId)}
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Root option */}
              <div
                className={`flex items-center py-3 cursor-pointer transition-colors border-b ${
                  selectedFolderId === null 
                    ? 'bg-blue-50 border-2 border-blue-300 rounded-md mx-2 shadow-sm' 
                    : 'hover:bg-gray-50'
                }`}
                style={{
                  paddingLeft: '8px',
                  paddingRight: '8px'
                }}
                onClick={() => setSelectedFolderId(null)}
              >
                <Folder className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                <span className={`text-sm font-medium flex-1 ${
                  selectedFolderId === null ? 'font-semibold text-blue-700' : ''
                }`}>My Files (Root)</span>
              </div>

              {/* Folder tree */}
              <div className="py-2">
                {folders.map(folder => renderFolder(folder))}
              </div>
            </>
          )}
        </div>

        {/* Create new folder */}
        <div className="border-t p-4">
          <div className="flex items-center space-x-2 mb-3">
            <input
              type="text"
              placeholder="New folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || creatingFolder}
              variant="outline"
              size="sm"
            >
              <FolderPlus className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              onClick={onClose}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSelect}
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? 'Moving...' : getButtonText()}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
