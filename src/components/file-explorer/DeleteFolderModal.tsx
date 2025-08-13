import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useDeleteFolder } from '../../hooks/useFolders';
import { useToast } from '../../contexts/ToastContext';
import type { Folder } from '../../services/supabase/folder-service';

interface DeleteFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: Folder | null;
}

export const DeleteFolderModal: React.FC<DeleteFolderModalProps> = ({
  isOpen,
  onClose,
  folder
}) => {
  const [error, setError] = useState<string | null>(null);
  const deleteFolderMutation = useDeleteFolder();
  const { showSuccess, showError } = useToast();

  if (!isOpen || !folder) return null;

  const handleDelete = async () => {
    try {
      await deleteFolderMutation.mutateAsync(folder);
      setError(null);
      showSuccess('Folder Deleted', `Folder ${folder.name} has been deleted successfully.`);
      onClose();
    } catch (err) {
      setError('Error deleting folder. Please try again.');
      showError('Delete Error', 'Could not delete folder. Please try again.');
      console.error('Error deleting folder:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Trash2 className="mr-2 h-5 w-5 text-red-600" />
            Delete Folder
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700">
            Are you sure you want to delete the folder <strong>{folder.name}</strong>?
          </p>
          <p className="text-gray-700 mt-2">
            This action will delete the folder and all files it contains. This action cannot be undone.
          </p>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={deleteFolderMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={deleteFolderMutation.isPending}
          >
            {deleteFolderMutation.isPending ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </span>
            ) : (
              'Delete'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
