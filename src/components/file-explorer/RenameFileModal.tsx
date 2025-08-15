import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { useRenameFile } from '../../hooks/useFiles';
import { useToast } from '../../hooks/useToast';
import { AlertTriangle } from 'lucide-react';
import type { File as FileType } from '../../services/supabase/file-service';

export interface RenameFileModalProps {
  isOpen: boolean;
  file: FileType;
  onClose: () => void;
}

// Utility function for file extension handling
const getFileExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
};

export const RenameFileModal: React.FC<RenameFileModalProps> = ({
  isOpen,
  file,
  onClose
}) => {
  const [newName, setNewName] = useState(file.name);
  const [showExtensionWarning, setShowExtensionWarning] = useState(false);
  const { mutateAsync: renameFile, isPending } = useRenameFile();
  const { showSuccess, showError } = useToast();

  const originalExtension = getFileExtension(file.name);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewName(file.name);
      setShowExtensionWarning(false);
    }
  }, [isOpen, file.name]);

  // Check for extension changes
  useEffect(() => {
    const newExtension = getFileExtension(newName);
    const hasExtensionChanged = originalExtension !== newExtension;
    const hasExtensionBeenRemoved = originalExtension && !newExtension;
    
    setShowExtensionWarning(Boolean(hasExtensionChanged || hasExtensionBeenRemoved));
  }, [newName, originalExtension]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = newName.trim();
    
    // Validation: Empty name
    if (!trimmedName) {
      showError('Error', 'File name cannot be empty');
      return;
    }
    
    // Validation: Only whitespace
    if (trimmedName.length === 0) {
      showError('Error', 'File name cannot be only spaces');
      return;
    }
    
    // Validation: Check for extension removal/change
    const newExtension = getFileExtension(trimmedName);
    const hasExtensionBeenRemoved = originalExtension && !newExtension;
    const hasExtensionChanged = originalExtension !== newExtension;
    
    if (hasExtensionBeenRemoved) {
      const confirmRemoval = window.confirm(
        `Warning: You are removing the file extension "${originalExtension}". This may make the file unusable. Do you want to continue?`
      );
      if (!confirmRemoval) {
        return;
      }
    } else if (hasExtensionChanged && originalExtension && newExtension) {
      const confirmChange = window.confirm(
        `Warning: You are changing the file extension from "${originalExtension}" to "${newExtension}". This may affect how the file opens. Do you want to continue?`
      );
      if (!confirmChange) {
        return;
      }
    }
    
    try {
      await renameFile({
        fileId: file.id,
        newFilename: trimmedName
      });
      
      showSuccess('Success', `File renamed to "${trimmedName}" successfully`);
      onClose();
    } catch (error) {
      console.error('Error renaming file:', error);
      showError('Error', 'Failed to rename file. Please try again.');
    }
  };

  const isNameEmpty = !newName.trim();
  const isNameUnchanged = newName.trim() === file.name;
  const isSubmitDisabled = isPending || isNameEmpty || isNameUnchanged;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div 
        className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-gray-600 mb-4">Renaming file: <strong>{file.name}</strong></p>
        
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <Label htmlFor="fileName">New name</Label>
            <Input
              id="fileName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="File name"
              className="w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSubmitDisabled) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
            />
            
            {/* Extension warning */}
            {showExtensionWarning && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Extension Warning</p>
                  <p>
                    {originalExtension && !getFileExtension(newName) 
                      ? `You are removing the file extension "${originalExtension}". This may make the file unusable.`
                      : `You are changing the file extension. This may affect how the file opens.`
                    }
                  </p>
                </div>
              </div>
            )}
            
            {/* Empty name warning */}
            {isNameEmpty && newName !== file.name && (
              <div className="mt-2 text-sm text-red-600">
                File name cannot be empty
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={(e) => {
                e.preventDefault();
                onClose();
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitDisabled}
              onClick={(e) => {
                if (isSubmitDisabled) {
                  e.preventDefault();
                  return;
                }
              }}
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
