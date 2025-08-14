import React, { useState } from 'react';
import { Trash2, RotateCcw, X, AlertTriangle, Folder } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTrashFiles, useTrashFolders, useRestoreFileFromTrash, useRestoreFolderFromTrash, usePermanentDeleteFile, usePermanentDeleteFolder, useEmptyTrash } from '../../hooks/useTrash';
import { useToast } from '../../contexts/ToastContext';
import { getFileIcon } from '../../types/file';

// Utility functions
const formatFileSize = (bytes: number | null): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  else if (diffInDays === 1) return 'Yesterday';
  else if (diffInDays < 7) return `${diffInDays} days ago`;
  else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const TrashPage: React.FC = () => {
  // const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set()); // Para futuras funcionalidades
  const [showEmptyTrashModal, setShowEmptyTrashModal] = useState(false);
  
  const { data: trashFiles = [], isLoading: filesLoading } = useTrashFiles();
  const { data: trashFolders = [], isLoading: foldersLoading } = useTrashFolders();
  
  const restoreFileMutation = useRestoreFileFromTrash();
  const restoreFolderMutation = useRestoreFolderFromTrash();
  const deleteFileMutation = usePermanentDeleteFile();
  const deleteFolderMutation = usePermanentDeleteFolder();
  const emptyTrashMutation = useEmptyTrash();
  
  const { showSuccess, showError } = useToast();
  
  const isLoading = filesLoading || foldersLoading;
  const hasItems = trashFiles.length > 0 || trashFolders.length > 0;
  
  const handleRestoreFile = async (fileId: string, fileName: string) => {
    try {
      await restoreFileMutation.mutateAsync(fileId);
      showSuccess('File Restored', `"${fileName}" has been restored successfully.`);
    } catch (error) {
      showError('Restore Failed', 'Could not restore the file. Please try again.');
    }
  };
  
  const handleRestoreFolder = async (folderId: string, folderName: string) => {
    try {
      await restoreFolderMutation.mutateAsync(folderId);
      showSuccess('Folder Restored', `"${folderName}" has been restored successfully.`);
    } catch (error) {
      showError('Restore Failed', 'Could not restore the folder. Please try again.');
    }
  };
  
  const handlePermanentDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${fileName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteFileMutation.mutateAsync(fileId);
      showSuccess('File Deleted', `"${fileName}" has been permanently deleted.`);
    } catch (error) {
      showError('Delete Failed', 'Could not delete the file. Please try again.');
    }
  };
  
  const handlePermanentDeleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${folderName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteFolderMutation.mutateAsync(folderId);
      showSuccess('Folder Deleted', `"${folderName}" has been permanently deleted.`);
    } catch (error) {
      showError('Delete Failed', 'Could not delete the folder. Please try again.');
    }
  };
  
  const handleEmptyTrash = async () => {
    try {
      const result = await emptyTrashMutation.mutateAsync();
      showSuccess(
        'Trash Emptied', 
        `Successfully deleted ${result.deletedFiles} files and ${result.deletedFolders} folders.`
      );
      // setSelectedItems será usado en futuras funcionalidades
      setShowEmptyTrashModal(false);
    } catch (error) {
      showError('Empty Trash Failed', 'Could not empty trash. Please try again.');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Trash2 className="h-6 w-6 text-slate-600 mr-3" />
          <h1 className="text-2xl font-semibold text-slate-900">Trash</h1>
          <span className="ml-3 px-2 py-1 bg-slate-100 text-slate-600 text-sm rounded-full">
            {trashFiles.length + trashFolders.length} items
          </span>
        </div>
        
        {hasItems && (
          <Button
            variant="danger"
            onClick={() => setShowEmptyTrashModal(true)}
            disabled={emptyTrashMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Empty Trash
          </Button>
        )}
      </div>
      
      {!hasItems ? (
        <div className="text-center py-12">
          <Trash2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Trash is empty</h3>
          <p className="text-slate-500">Items you delete will appear here before being permanently removed.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Folders in trash */}
          {trashFolders.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-slate-900 mb-3">Folders</h2>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {trashFolders.map((folder) => (
                  <div key={folder.id} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                    <div className="flex items-center flex-1">
                      <Folder className="h-5 w-5 text-blue-500 mr-3" />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{folder.name}</div>
                        <div className="text-sm text-slate-500">
                          Deleted {formatDate(folder.deleted_at)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRestoreFolder(folder.id, folder.name)}
                        disabled={restoreFolderMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePermanentDeleteFolder(folder.id, folder.name)}
                        disabled={deleteFolderMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Delete Forever
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Files in trash */}
          {trashFiles.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-slate-900 mb-3">Files</h2>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {trashFiles.map((file) => {
                  const FileIcon = getFileIcon(file.filename);
                  return (
                    <div key={file.id} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                      <div className="flex items-center flex-1">
                        <FileIcon className="h-5 w-5 text-slate-500 mr-3" />
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{file.filename}</div>
                          <div className="text-sm text-slate-500">
                            {formatFileSize(file.size)} • Deleted {formatDate(file.deleted_at)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRestoreFile(file.id, file.filename)}
                          disabled={restoreFileMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePermanentDeleteFile(file.id, file.filename)}
                          disabled={deleteFileMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Delete Forever
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Empty Trash Confirmation Modal */}
      {showEmptyTrashModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-slate-900">Empty Trash</h3>
            </div>
            
            <p className="text-slate-600 mb-6">
              Are you sure you want to permanently delete all items in trash? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => setShowEmptyTrashModal(false)}
                disabled={emptyTrashMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleEmptyTrash}
                disabled={emptyTrashMutation.isPending}
              >
                {emptyTrashMutation.isPending ? 'Emptying...' : 'Empty Trash'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
