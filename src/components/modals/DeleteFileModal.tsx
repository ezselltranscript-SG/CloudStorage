import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/Dialog.js';
import { Button } from '../ui/Button';
import { useToast } from '../../contexts/ToastContext';
import { useDeleteFile } from '../../hooks/useFiles';
import type { File as FileType } from '../../services/supabase/file-service';

interface DeleteFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileType | null;
}

export const DeleteFileModal: React.FC<DeleteFileModalProps> = ({ isOpen, onClose, file }) => {
  const { mutateAsync: deleteFile, isPending } = useDeleteFile();
  const { showSuccess, showError } = useToast();

  const handleDelete = async () => {
    if (!file) return;
    
    try {
      await deleteFile(file);
      showSuccess('Archivo eliminado', `El archivo ${file.filename} ha sido eliminado correctamente.`);
      onClose();
    } catch (error) {
      console.error('Error al eliminar el archivo:', error);
      showError('Error al eliminar', 'No se pudo eliminar el archivo. Inténtelo de nuevo.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Eliminar archivo</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar el archivo <strong>{file?.filename}</strong>? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            variant="danger" 
            onClick={handleDelete} 
            disabled={isPending}
          >
            {isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
