import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useDeleteFile } from '../../hooks/useFiles';
import { useToast } from '../../hooks/useToast';
import type { File as FileType } from '../../services/supabase/file-service';

export interface DeleteFileModalProps {
  isOpen: boolean;
  file: FileType;
  onClose: () => void;
}

export const DeleteFileModal: React.FC<DeleteFileModalProps> = ({
  isOpen,
  file,
  onClose
}) => {
  const { mutateAsync: deleteFile, isPending } = useDeleteFile();
  const { showSuccess, showError } = useToast();

  const handleDelete = async () => {
    try {
      await deleteFile(file);
      showSuccess(`File "${file.filename}" deleted successfully`);
      onClose();
    } catch (error) {
      console.error('Error deleting file:', error);
      showError('Error deleting file');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4">Delete File</h2>
        
        <p className="mb-4 text-gray-700">
          Are you sure you want to delete the file <span className="font-medium">{file.filename}</span>?
          This action cannot be undone.
        </p>
        
        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default DeleteFileModal;
