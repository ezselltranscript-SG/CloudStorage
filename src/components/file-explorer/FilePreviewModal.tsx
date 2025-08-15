import React, { useState, useEffect } from 'react';
import { X, Download, Share2, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';
import { useFilePublicUrl } from '../../hooks/useFiles';
import type { File as FileType } from '../../services/supabase/file-service';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileType | null;
  onShare?: (file: FileType) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  file,
  onShare
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const { publicUrl } = useFilePublicUrl(file?.storage_path || null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setPreviewError(null);
    }
  }, [isOpen, file]);

  if (!isOpen || !file || !publicUrl) return null;

  const fileExt = file.name.split('.').pop()?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt || '');
  const isPdf = fileExt === 'pdf';
  const isPreviewable = isImage || isPdf;

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setPreviewError('No se pudo cargar la vista previa');
  };

  const handleDownload = () => {
    if (publicUrl) {
      const link = document.createElement('a');
      link.href = publicUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{file.name}</h2>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDownload}
              title="Descargar archivo"
            >
              <Download className="h-4 w-4" />
            </Button>
            {onShare && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onShare(file)}
                title="Compartir archivo"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.open(publicUrl, '_blank')}
              title="Abrir en nueva pestaña"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-50">
          {isLoading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span>Cargando vista previa...</span>
            </div>
          )}

          {previewError && (
            <div className="text-red-500 flex flex-col items-center">
              <p>{previewError}</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={handleDownload}
              >
                Descargar archivo
              </Button>
            </div>
          )}

          {isPreviewable ? (
            isImage ? (
              <img 
                src={publicUrl} 
                alt={file.name} 
                className="max-w-full max-h-full object-contain"
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{ display: isLoading ? 'none' : 'block' }}
              />
            ) : isPdf ? (
              <iframe 
                src={`${publicUrl}#toolbar=0`} 
                className="w-full h-full border-0"
                title={file.name}
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{ display: isLoading ? 'none' : 'block' }}
              />
            ) : null
          ) : (
            !isLoading && !previewError && (
              <div className="text-center">
                <p className="mb-4">No hay vista previa disponible para este tipo de archivo.</p>
                <Button 
                  variant="outline"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar archivo
                </Button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
