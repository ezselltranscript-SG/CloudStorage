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

  // File type detection
  const fileExt = file?.name.split('.').pop()?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt || '');
  const isPdf = fileExt === 'pdf';
  const isVideo = ['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(fileExt || '');
  const isText = ['txt', 'md', 'json', 'csv', 'log'].includes(fileExt || '');
  const isPreviewable = isImage || isPdf || isVideo || isText;

  useEffect(() => {
    if (isOpen && file) {
      setIsLoading(true);
      setPreviewError(null);
      
      // For non-previewable files, hide loading immediately
      if (!isPreviewable) {
        setIsLoading(false);
      }
      // For previewable files, we'll rely on onLoad events or timeout
    }
  }, [isOpen, file, isPreviewable]);

  useEffect(() => {
    // Debug: Log the file and publicUrl to see what's happening
    if (file) {
      console.log('FilePreviewModal - File:', file);
      console.log('FilePreviewModal - Storage path:', file.storage_path);
      console.log('FilePreviewModal - Public URL:', publicUrl);
    }
  }, [file, publicUrl]);

  if (!isOpen || !file) return null;

  // Don't return null if no publicUrl, show error instead
  if (!publicUrl && file.storage_path) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-4">Preview Error</h2>
            <p className="text-red-500 mb-4">Could not generate preview URL</p>
            <p className="text-sm text-gray-600 mb-4">File: {file.name}</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setPreviewError('Could not load preview');
  };

  const handlePdfLoad = () => {
    setIsLoading(false);
  };

  const handlePdfError = () => {
    setIsLoading(false);
    setPreviewError('Could not load PDF preview');
  };

  const [textContent, setTextContent] = useState<string>('');

  const loadTextContent = async () => {
    if (isText && publicUrl) {
      try {
        const response = await fetch(publicUrl);
        const content = await response.text();
        setTextContent(content);
        setIsLoading(false);
      } catch (error) {
        setPreviewError('Could not load text content');
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isText && publicUrl) {
      loadTextContent();
    }
  }, [isText, publicUrl]);

  const handleDownload = async () => {
    if (!publicUrl) return;
    
    try {
      // Descargar el archivo como blob
      const response = await fetch(publicUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      
      const blob = await response.blob();
      
      // Crear URL temporal para el blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Crear enlace de descarga con el nombre original
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.name; // Usar el nombre original del archivo
      link.style.display = 'none';
      
      // Añadir al DOM, hacer click y remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar la URL temporal
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback al método anterior si falla
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
              onClick={() => publicUrl && window.open(publicUrl, '_blank')}
              title="Abrir en nueva pestaña"
              disabled={!publicUrl}
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
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <span className="text-slate-600">Loading preview...</span>
            </div>
          )}

          {previewError && (
            <div className="text-red-500 flex flex-col items-center">
              <p className="mb-4">{previewError}</p>
              <Button 
                variant="outline" 
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download file
              </Button>
            </div>
          )}

          {/* Always show content area, handle loading per content type */}
          <>
            {isImage && publicUrl && (
              <div className="w-full h-full flex items-center justify-center relative">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                      <span className="text-slate-600">Loading image...</span>
                    </div>
                  </div>
                )}
                <img 
                  src={publicUrl} 
                  alt={file.name} 
                  className="max-w-full max-h-full object-contain"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  style={{ display: isLoading ? 'none' : 'block' }}
                />
              </div>
            )}
            
            {isPdf && publicUrl && (
              <div className="w-full h-full relative">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                      <span className="text-slate-600">Loading PDF...</span>
                    </div>
                  </div>
                )}
                <iframe 
                  src={`${publicUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                  className="w-full h-full border-0"
                  title={file.name}
                  onLoad={handlePdfLoad}
                  onError={handlePdfError}
                />
              </div>
            )}
              
              {isVideo && publicUrl && (
                <video 
                  src={publicUrl} 
                  controls 
                  className="max-w-full max-h-full"
                  onLoadedData={handleImageLoad}
                  onError={handleImageError}
                >
                  Your browser does not support the video tag.
                </video>
              )}
              
              {isText && textContent && (
                <div className="w-full h-full bg-white rounded border">
                  <pre className="p-4 text-sm font-mono overflow-auto h-full whitespace-pre-wrap">
                    {textContent}
                  </pre>
                </div>
              )}
              
              {!isPreviewable && (
                <div className="text-center">
                  <div className="mb-4 p-8 bg-slate-100 rounded-lg">
                    <div className="text-4xl mb-2">📄</div>
                    <p className="text-slate-600 mb-2">Preview not available</p>
                    <p className="text-sm text-slate-500">
                      This file type ({fileExt?.toUpperCase() || 'Unknown'}) cannot be previewed
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download file
                  </Button>
                </div>
              )}
            </>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
