import React, { useState, useRef, useEffect } from 'react';
import { FileText, FolderPlus, Upload, ChevronRight, Home, Loader2, Search } from 'lucide-react';
import { FileItem } from './FileItem';
import { FolderItem } from './FolderItem';
import { UploadFileModal } from './UploadFileModal';
import { NewFolderModal } from './NewFolderModal';
import { RenameFileModal } from './RenameFileModal';
import { RenameFolderModal } from './RenameFolderModal';
import { DeleteFileModal } from './DeleteFileModal';
import { DeleteFolderModal } from './DeleteFolderModal';
import { FilePreviewModal } from './FilePreviewModal';
import { ShareFileModal } from './ShareFileModal';
import { SelectionToolbar } from '../ui/SelectionToolbar';
import { Button } from '../ui/Button';
import { useFilesByFolderId } from '../../hooks/useFiles';
import { useFoldersByParentId } from '../../hooks/useFolders';
import { folderService } from '../../services/supabase/folder-service';
import { fileService } from '../../services/supabase/file-service';
import { useToast } from '../../contexts/ToastContext';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { SelectAllCheckbox } from '../ui/SelectAllCheckbox';
import { downloadFolderAsZip, type FolderDownloadProgress } from '../../services/folder-download-service';
import type { File } from '../../services/supabase/file-service';
import type { Folder } from '../../services/supabase/folder-service';

interface FileExplorerProps {
  currentFolderId: string | null;
  onFolderClick: (folderId: string | null) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ 
  currentFolderId, 
  onFolderClick 
}) => {
  // Estados para búsqueda y filtrado
  const [searchQuery, setSearchQuery] = useState('');
  
  
  // Estados para drag & drop de archivos (upload)
  const [isDragging, setIsDragging] = useState(false);
  const handleFileDragEnter = () => setIsDragging(true);
  const handleFileDragLeave = () => setIsDragging(false);
  const handleFileDrop = () => setIsDragging(false);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  
  // Estados para modales
  const [isUploadFileModalOpen, setIsUploadFileModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isRenameFileModalOpen, setIsRenameFileModalOpen] = useState(false);
  const [isRenameFolderModalOpen, setIsRenameFolderModalOpen] = useState(false);
  const [isDeleteFileModalOpen, setIsDeleteFileModalOpen] = useState(false);
  const [isDeleteFolderModalOpen, setIsDeleteFolderModalOpen] = useState(false);
  const [isFilePreviewModalOpen, setIsFilePreviewModalOpen] = useState(false);
  const [isShareFileModalOpen, setIsShareFileModalOpen] = useState(false);
  
  // Estados para elementos seleccionados
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  
  // Hooks para datos
  const { 
    data: folders, 
    isLoading: foldersLoading, 
    error: foldersError 
  } = useFoldersByParentId(currentFolderId);
  
  const { 
    data: files, 
    isLoading: filesLoading, 
    error: filesError 
  } = useFilesByFolderId(currentFolderId || undefined);
  
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  
  // Fetch current folder data
  useEffect(() => {
    const fetchCurrentFolder = async () => {
      if (currentFolderId) {
        try {
          // Para carpetas compartidas, no filtrar por userId para poder acceder a carpetas de otros usuarios
          const folder = await folderService.getFolderById(currentFolderId);
          setCurrentFolder(folder);
        } catch (error) {
          console.error('Error fetching current folder:', error);
          setCurrentFolder(null);
        }
      } else {
        setCurrentFolder(null);
      }
    };
    
    fetchCurrentFolder();
  }, [currentFolderId]);
  
  const { showSuccess, showError } = useToast();
  
  // Breadcrumbs
  const [breadcrumbs, setBreadcrumbs] = useState<Folder[]>([]);
  
  // Efecto para construir breadcrumbs
  useEffect(() => {
    const buildBreadcrumbs = async () => {
      if (!currentFolderId) {
        setBreadcrumbs([]);
        return;
      }
      
      if (currentFolder) {
        let path: Folder[] = [currentFolder];
        let parentId = currentFolder.parent_id;
        
        while (parentId) {
          try {
            // Para carpetas compartidas, no filtrar por userId para poder acceder a carpetas de otros usuarios
            const parentFolder = await folderService.getFolderById(parentId);
            if (parentFolder) {
              path.unshift(parentFolder);
              parentId = parentFolder.parent_id;
            } else {
              break;
            }
          } catch (error) {
            console.error('Error fetching parent folder:', error);
            break;
          }
        }
        
        setBreadcrumbs(path);
      }
    };
    
    buildBreadcrumbs();
  }, [currentFolderId, currentFolder]);
  
  // Filtrar archivos y carpetas basado en la búsqueda
  const filteredFolders = (folders || []).filter(folder => 
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredFiles = (files || []).filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );


  
  // Handlers para drag & drop de archivos (upload)
  useEffect(() => {
    const handleFileDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    
    const element = dropAreaRef.current;
    if (element) {
      element.addEventListener('dragenter', handleFileDragEnter);
      element.addEventListener('dragleave', handleFileDragLeave);
      element.addEventListener('dragover', handleFileDragOver);
      element.addEventListener('drop', handleFileDrop);
      
      return () => {
        element.removeEventListener('dragenter', handleFileDragEnter);
        element.removeEventListener('dragleave', handleFileDragLeave);
        element.removeEventListener('dragover', handleFileDragOver);
        element.removeEventListener('drop', handleFileDrop);
      };
    }
  }, [currentFolderId]);
  
  // Handlers para carpetas
  const handleFolderClick = (folder: Folder) => {
    onFolderClick(folder.id);
  };

  const handleFolderRename = (folder: Folder) => {
    setSelectedFolder(folder);
    setIsRenameFolderModalOpen(true);
  };

  // Handler para eliminar carpetas
  const handleFolderDelete = (folder: Folder) => {
    setSelectedFolder(folder);
    setIsDeleteFolderModalOpen(true);
  };
  
  // Handlers para archivos
  const handleFilePreview = (file: File) => {
    setSelectedFile(file);
    setIsFilePreviewModalOpen(true);
  };
  
  const handleFileRename = (file: File) => {
    setSelectedFile(file);
    setIsRenameFileModalOpen(true);
  };
  
  const handleFileDelete = (file: File) => {
    setSelectedFile(file);
    setIsDeleteFileModalOpen(true);
  };
  
  const handleFileDownload = async (file: File) => {
    try {
      if (!file.storage_path) {
        showError('Error', 'File path not found. Cannot download.');
        return;
      }

      // Descargar el archivo usando fetch para tener control total sobre el nombre
      const publicUrl = fileService.getPublicUrl(file.storage_path);
      
      if (publicUrl) {
        showSuccess('Download Started', `Downloading ${file.name}...`);
        
        // Fetch el archivo como blob
        const response = await fetch(publicUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
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
        
        showSuccess('Download Complete', `${file.name} downloaded successfully`);
      } else {
        showError('Error', 'Cannot generate download URL. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      showError('Error', 'Failed to download file. Please try again.');
    }
  };
  
  const handleShareFile = (file: File) => {
    setSelectedFile(file);
    setIsShareFileModalOpen(true);
  };

  const handleFolderMove = () => {
    // This will be handled by the FolderPicker in the context menu
  };

  const handleFolderDownload = async (folder: Folder) => {
    try {
      showSuccess('Download Started', `Preparing ${folder.name} for download...`);
      
      await downloadFolderAsZip(folder, (progress: FolderDownloadProgress) => {
        // Mostrar progreso en el toast
        showSuccess(
          'Downloading...', 
          `Processing ${progress.current}/${progress.total} files: ${progress.currentFile}`
        );
      });
      
      showSuccess('Download Complete', `${folder.name}.zip downloaded successfully`);
    } catch (error) {
      console.error('Error downloading folder:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showError('Download Failed', `Failed to download ${folder.name}: ${errorMessage}`);
    }
  };

  const handleFileMove = (file: File) => {
    // This will be handled by the FolderPicker in the context menu
    console.log('Move file:', file.name);
  };
  
  // Renderizado condicional
  const isLoading = foldersLoading || filesLoading;
  const hasError = foldersError || filesError;
  const isEmpty = !isLoading && !hasError && filteredFolders.length === 0 && filteredFiles.length === 0;
  
  const { handleDragOver: handleItemDragOver, handleDragLeave: handleItemDragLeave, handleDrop: handleItemDrop, canDropOnTarget, isDragging: isDraggingItems } = useDragAndDrop();
  
  return (
      <div 
        className="relative" 
        ref={dropAreaRef}
        onDragOver={(e) => {
          e.preventDefault();
          if (canDropOnTarget(currentFolderId)) {
            handleItemDragOver(e, currentFolderId);
          }
        }}
        onDragLeave={handleItemDragLeave}
        onDrop={(e) => {
          e.preventDefault();
          if (canDropOnTarget(currentFolderId)) {
            handleItemDrop(e, currentFolderId);
          }
        }}
      >
        <SelectionToolbar />
      {/* Modern Header with Breadcrumbs */}
      <div className="mb-8">
        {/* Breadcrumbs navigation */}
        <div className="flex items-center text-sm mb-3">
          <button 
            onClick={() => onFolderClick(null)}
            className="flex items-center text-slate-600 hover:text-blue-600 transition"
          >
            <Home className="h-3.5 w-3.5 mr-1" />
            <span>Home</span>
          </button>
          
          {breadcrumbs.length > 0 && (
            <>
              <ChevronRight className="h-3.5 w-3.5 mx-2 text-slate-400" />
              {breadcrumbs.map((folder, index) => (
                <React.Fragment key={folder.id}>
                  <button
                    onClick={() => onFolderClick(folder.id)}
                    className="text-slate-600 hover:text-blue-600 transition font-medium"
                  >
                    {folder.name}
                  </button>
                  {index < breadcrumbs.length - 1 && (
                    <ChevronRight className="h-3.5 w-3.5 mx-2 text-slate-400" />
                  )}
                </React.Fragment>
              ))}
            </>
          )}
        </div>
        
        {/* Title and actions row */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">
            {currentFolderId ? currentFolder?.name || 'Loading...' : 'My Files'}
          </h1>
          
          <div className="flex items-center gap-3">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search in current folder"
                className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-slate-50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            

            {/* Action buttons */}
            <Button
              onClick={() => setIsNewFolderModalOpen(true)}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg"
            >
              <FolderPlus className="h-4 w-4" />
              <span>New Folder</span>
            </Button>
            
            <Button
              onClick={() => setIsUploadFileModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Files</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mensaje de carga */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-slate-100 shadow-sm">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      )}
      
      {/* Área de drop para drag & drop */}
      {(isDragging || isDraggingItems) && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-90 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center z-10">
          <div className="text-center p-8 bg-white bg-opacity-80 rounded-lg shadow-sm">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-base font-medium text-slate-900 mb-2">
              {isDraggingItems ? 'Move items here' : 'Drop files here'}
            </h3>
            <p className="text-slate-600 text-sm">
              {isDraggingItems 
                ? 'Drop to move the selected items to this folder'
                : 'Drop your files to upload them to this folder'
              }
            </p>
          </div>
        </div>
      )}

      {/* Estado de error */}
      {hasError && (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <h3 className="text-base font-medium text-slate-900 mb-2">Error loading content</h3>
          <p className="text-slate-600 text-center max-w-md text-sm">
            There was a problem loading the files and folders. Please try again later.
          </p>
          <button className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-md text-sm font-medium text-slate-700 transition">
            Try Again
          </button>
        </div>
      )}
      
      {isEmpty && (
        <div className="text-center py-16">
          <div className="mx-auto h-12 w-12 text-slate-400">
            <FileText className="h-full w-full" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-slate-900">No items found</h3>
          <p className="mt-2 text-sm text-slate-500">
            {searchQuery 
              ? 'No items match your search.' 
              : 'Get started by uploading files or creating folders.'}
          </p>
        </div>
      )}
      
      {/* Listado de carpetas y archivos */}
      {!isLoading && !hasError && (filteredFolders.length > 0 || filteredFiles.length > 0) && (
        <div>
          {/* Sección de carpetas */}
          {filteredFolders.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-medium text-slate-900 mb-3">Folders</h2>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {/* Cabecera de tabla */}
                <div className="grid grid-cols-12 items-center px-4 py-2 border-b border-slate-100 text-xs font-medium text-slate-500">
                  <div className="col-span-6 flex items-center gap-3">
                    <SelectAllCheckbox 
                      items={filteredFolders.map(folder => ({
                        id: folder.id,
                        type: 'folder' as const,
                        name: folder.name
                      }))}
                      className="h-4 w-4"
                    />
                    Name
                  </div>
                  <div className="col-span-2">Modified</div>
                  <div className="col-span-2">Size</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                
                {/* Carpetas */}
                {filteredFolders.map((folder) => (
                  <FolderItem
                    key={folder.id}
                    folder={folder}
                    onClick={() => handleFolderClick(folder)}
                    onRename={() => handleFolderRename(folder)}
                    onDelete={() => handleFolderDelete(folder)}
                    onMove={() => handleFolderMove()}
                    onDownload={() => handleFolderDownload(folder)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Sección de archivos */}
          {filteredFiles.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-slate-900 mb-3">Files</h2>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {/* Cabecera de tabla */}
                <div className="grid grid-cols-12 items-center px-4 py-2 border-b border-slate-100 text-xs font-medium text-slate-500">
                  <div className="col-span-6 flex items-center gap-3">
                    <SelectAllCheckbox 
                      items={filteredFiles.map(file => ({
                        id: file.id,
                        type: 'file' as const,
                        name: file.name
                      }))}
                      className="h-4 w-4"
                    />
                    Name
                  </div>
                  <div className="col-span-2">Modified</div>
                  <div className="col-span-2">Size</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                
                {/* Archivos */}
                {filteredFiles.map((file) => (
                  <FileItem
                    key={file.id}
                    file={file}
                    onPreview={() => handleFilePreview(file)}
                    onRename={() => handleFileRename(file)}
                    onDelete={() => handleFileDelete(file)}
                    onDownload={() => handleFileDownload(file)}
                    onShare={() => handleShareFile(file)}
                    onMove={() => handleFileMove(file)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Modales */}
      <UploadFileModal
        isOpen={isUploadFileModalOpen}
        currentFolderId={currentFolderId}
        onClose={() => setIsUploadFileModalOpen(false)}
      />
      
      <NewFolderModal
        isOpen={isNewFolderModalOpen}
        currentFolderId={currentFolderId}
        onClose={() => setIsNewFolderModalOpen(false)}
      />
      
      {isRenameFileModalOpen && selectedFile && (
        <RenameFileModal
          isOpen={isRenameFileModalOpen}
          file={selectedFile as File}
          onClose={() => {
            setIsRenameFileModalOpen(false);
            setSelectedFile(null);
          }}
        />
      )}
      
      {isRenameFolderModalOpen && selectedFolder && (
        <RenameFolderModal
          isOpen={isRenameFolderModalOpen}
          folder={selectedFolder as Folder}
          onClose={() => {
            setIsRenameFolderModalOpen(false);
            setSelectedFolder(null);
          }}
        />
      )}
      
      {isDeleteFileModalOpen && selectedFile && (
        <DeleteFileModal
          isOpen={isDeleteFileModalOpen}
          file={selectedFile as File}
          onClose={() => {
            setIsDeleteFileModalOpen(false);
            setSelectedFile(null);
          }}
        />
      )}
      
      {isDeleteFolderModalOpen && selectedFolder && (
        <DeleteFolderModal
          isOpen={isDeleteFolderModalOpen}
          folder={selectedFolder as Folder}
          onClose={() => {
            setIsDeleteFolderModalOpen(false);
            setSelectedFolder(null);
          }}
        />
      )}
      
      {isFilePreviewModalOpen && selectedFile && (
        <FilePreviewModal
          isOpen={isFilePreviewModalOpen}
          file={selectedFile as File}
          onClose={() => {
            setIsFilePreviewModalOpen(false);
            setSelectedFile(null);
          }}
        />
      )}
      
      {isShareFileModalOpen && selectedFile && (
        <ShareFileModal
          isOpen={isShareFileModalOpen}
          file={selectedFile as File}
          onClose={() => {
            setIsShareFileModalOpen(false);
            setSelectedFile(null);
          }}
        />
      )}
      </div>
  );
}
