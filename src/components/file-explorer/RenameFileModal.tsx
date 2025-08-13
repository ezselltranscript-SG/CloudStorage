import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { useRenameFile } from '../../hooks/useFiles';
import { useToast } from '../../hooks/useToast';
import type { File as FileType } from '../../services/supabase/file-service';

export interface RenameFileModalProps {
  isOpen: boolean;
  file: FileType;
  onClose: () => void;
}

export const RenameFileModal: React.FC<RenameFileModalProps> = ({
  isOpen,
  file,
  onClose
}) => {
  const [newName, setNewName] = useState(file.filename);
  const { mutateAsync: renameFile, isPending } = useRenameFile();
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newName.trim()) {
      showError('File name cannot be empty');
      return;
    }
    
    try {
      await renameFile({
        fileId: file.id,
        newFilename: newName.trim()
      });
      
      showSuccess(`File renamed to "${newName}" successfully`);
      onClose();
    } catch (error) {
      console.error('Error renaming file:', error);
      showError('Error renaming file');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4">Rename File</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="fileName">New name</Label>
            <Input
              id="fileName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="File name"
              className="w-full"
              autoFocus
            />
          </div>
          
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
              type="submit"
              disabled={isPending || !newName.trim() || newName === file.filename}
            >
              {isPending ? 'Renaming...' : 'Rename'}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
};

export default RenameFileModal;
