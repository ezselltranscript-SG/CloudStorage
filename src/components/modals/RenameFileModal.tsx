import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog.js';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input.js';
import { Label } from '../ui/Label.js';
import { useRenameFile } from '../../hooks/useFiles';
import { useToast } from '../../contexts/ToastContext';
import type { File as FileType } from '../../services/supabase/file-service';

interface RenameFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileType | null;
}

export const RenameFileModal: React.FC<RenameFileModalProps> = ({ isOpen, onClose, file }) => {
  const [newFilename, setNewFilename] = useState('');
  const { mutate: renameFile, isPending } = useRenameFile();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (file) {
      setNewFilename(file.name);
    }
  }, [file]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!file || !newFilename.trim()) return;
    
    try {
      renameFile({
        fileId: file.id,
        newFilename: newFilename.trim()
      }, {
        onSuccess: () => {
          showSuccess('Archivo renombrado', `El archivo ha sido renombrado a ${newFilename.trim()}`);
          onClose();
        },
        onError: (error) => {
          console.error('Error al renombrar el archivo:', error);
          showError('Error al renombrar', 'No se pudo renombrar el archivo. Inténtelo de nuevo.');
        }
      });
    } catch (error) {
      console.error('Error inesperado:', error);
      showError('Error inesperado', 'Ocurrió un error inesperado. Inténtelo de nuevo.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Renombrar archivo</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="filename">Nuevo nombre</Label>
            <Input
              id="filename"
              value={newFilename}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFilename(e.target.value)}
              placeholder="Nombre del archivo"
              disabled={isPending}
              autoFocus
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !newFilename.trim()}>
              {isPending ? 'Renombrando...' : 'Renombrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
