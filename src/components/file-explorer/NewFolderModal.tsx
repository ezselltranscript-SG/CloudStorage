import React, { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils/cn';
import { useCreateFolder } from '../../hooks/useFolders';
import { useToast } from '../../contexts/ToastContext';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolderId: string | null;
}

export const NewFolderModal: React.FC<NewFolderModalProps> = ({
  isOpen,
  onClose,
  currentFolderId
}) => {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const createFolderMutation = useCreateFolder();
  const { showSuccess, showError } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!folderName.trim()) {
      setError('Folder name cannot be empty');
      showError('Invalid Name', 'Folder name cannot be empty');
      return;
    }

    try {
      await createFolderMutation.mutateAsync({
        name: folderName.trim(),
        parent_id: currentFolderId
      });
      setFolderName('');
      setError(null);
      showSuccess('Folder Created', `Folder ${folderName.trim()} has been created successfully.`);
      onClose();
    } catch (err) {
      setError('Error creating folder. Please try again.');
      showError('Creation Error', 'Could not create folder. Please try again.');
      console.error('Error creating folder:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <FolderPlus className="mr-2 h-5 w-5 text-blue-600" />
            New Folder
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 mb-1">
              Folder Name
            </label>
            <input
              type="text"
              id="folderName"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className={cn(
                "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                error ? "border-red-500" : "border-gray-300"
              )}
              placeholder="My folder"
              autoFocus
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={createFolderMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createFolderMutation.isPending}
            >
              {createFolderMutation.isPending ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Folder'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
