import React, { useState, useEffect } from 'react';
import { X, Folder, FolderPlus, ChevronRight, ChevronDown } from 'lucide-react';
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
}

export const FolderPicker: React.FC<FolderPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = "Move to...",
  excludeFolderIds = []
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

  const renderFolder = (folder: FolderNode, level = 0) => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isSelected = selectedFolderId === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center py-2 px-3 cursor-pointer hover:bg-gray-50 ${
            isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${12 + level * 20}px` }}
          onClick={() => setSelectedFolderId(folder.id)}
        >
          <div className="flex items-center flex-1">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(folder.id);
                }}
                className="p-1 hover:bg-gray-200 rounded mr-1"
              >
                {folder.expanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}
            <Folder className="w-4 h-4 text-blue-500 mr-2" />
            <span className="text-sm">{folder.name}</span>
          </div>
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
                className={`flex items-center py-3 px-3 cursor-pointer hover:bg-gray-50 border-b ${
                  selectedFolderId === null ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
                onClick={() => setSelectedFolderId(null)}
              >
                <Folder className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium">My Files (Root)</span>
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
            >
              Move Here
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
