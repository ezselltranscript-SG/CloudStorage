import React, { useState, useRef } from 'react';
import { FileUp, Upload, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils/cn';
import { useUploadFile } from '../../hooks/useFiles';
import { useToast } from '../../contexts/ToastContext';
import { v4 as uuidv4 } from 'uuid';

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolderId: string | null;
}

export const UploadFileModal: React.FC<UploadFileModalProps> = ({
  isOpen,
  onClose,
  currentFolderId
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadFileMutation = useUploadFile();
  const { showSuccess, showError } = useToast();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!currentFolderId) {
      setError('No folder selected to upload files');
      showError('Folder Error', 'No folder selected to upload files');
      return;
    }
    
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      showError('No Files', 'Please select at least one file to upload');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Subir archivos uno por uno
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileId = uuidv4();
        
        // Crear metadatos del archivo
        const fileMetadata = {
          id: fileId,
          filename: file.name,
          folder_id: currentFolderId
        };

        // Subir archivo
        await uploadFileMutation.mutateAsync({
          file: fileMetadata,
          fileData: file
        });

        // Actualizar progreso
        setProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }

      setSelectedFiles([]);
      setError(null);
      const fileText = selectedFiles.length === 1 ? 'file' : 'files';
      showSuccess('Upload Complete', `${selectedFiles.length} ${fileText} uploaded successfully.`);
      onClose();
    } catch (err) {
      setError('Error uploading one or more files. Please try again.');
      showError('Upload Error', 'Could not upload one or more files. Please try again.');
      console.error('Error uploading files:', err);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <FileUp className="mr-2 h-5 w-5 text-blue-600" />
            Upload Files
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div 
            className={cn(
              "border-2 border-dashed rounded-md p-6 mb-4 text-center cursor-pointer",
              "hover:bg-slate-100 transition-colors",
              error ? "border-red-300" : "border-gray-300"
            )}
            onClick={triggerFileInput}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Drag files here or click to select
            </p>
            <p className="text-xs text-gray-500 mt-1">
              You can upload multiple files
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Selected files ({selectedFiles.length})
              </h3>
              <ul className="max-h-40 overflow-y-auto border rounded-md divide-y">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="flex items-center justify-between p-2 hover:bg-slate-100">
                    <span className="text-sm truncate max-w-[80%]">{file.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {uploading && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">{progress}%</p>
            </div>
          )}

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploading || selectedFiles.length === 0}
            >
              {uploading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                'Upload Files'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
