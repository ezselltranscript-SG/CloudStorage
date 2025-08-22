import React, { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils/cn';
import { useUpdateFolder } from '../../hooks/useFolders';
import { useToast } from '../../contexts/ToastContext';
import type { Folder } from '../../services/supabase/folder-service';

interface RenameFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: Folder | null;
}

export const RenameFolderModal: React.FC<RenameFolderModalProps> = ({
  isOpen,
  onClose,
  folder
}) => {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const updateFolderMutation = useUpdateFolder();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (folder) {
      setFolderName(folder.name);
    }
  }, [folder]);

  if (!isOpen || !folder) return null;

  const validateFolderName = (name: string): string | null => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return 'Folder name cannot be empty';
    }
    
    if (trimmedName.length > 50) {
      return 'Folder name cannot exceed 50 characters';
    }
    
    // Check for invalid characters (common file system restrictions)
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(trimmedName)) {
      return 'Folder name contains invalid characters';
    }
    
    // Check for reserved names (Windows)
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
    if (reservedNames.test(trimmedName)) {
      return 'This folder name is reserved and cannot be used';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const validationError = validateFolderName(folderName);
    if (validationError) {
      setError(validationError);
      showError('Invalid Name', validationError);
      return;
    }

    try {
      await updateFolderMutation.mutateAsync({
        id: folder.id,
        folder: {
          name: folderName.trim()
        }
      });
      setError(null);
      showSuccess('Folder Renamed', `Folder has been renamed to ${folderName.trim()}`);
      onClose();
    } catch (err) {
      setError('Error renaming folder. Please try again.');
      showError('Rename Error', 'Could not rename folder. Please try again.');
      console.error('Error renaming folder:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Pencil className="mr-2 h-5 w-5 text-blue-600" />
            Rename Folder
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
              New name
            </label>
            <input
              type="text"
              id="folderName"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              maxLength={50}
              className={cn(
                "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                error ? "border-red-500" : "border-gray-300"
              )}
              placeholder="Folder name (max 50 characters)"
              autoFocus
            />
            <div className="mt-1 text-xs text-gray-500 text-right">
              {folderName.length}/50 characters
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={updateFolderMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateFolderMutation.isPending}
            >
              {updateFolderMutation.isPending ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
