import React, { useState, useRef, useEffect } from 'react';
import { FileText, FolderPlus, Upload, ChevronRight, Home, Loader2, MoreHorizontal, Search } from 'lucide-react';
import { FileItem } from './FileItem';
import { UploadFileModal } from './UploadFileModal';
import { NewFolderModal } from './NewFolderModal';
import { RenameFileModal } from './RenameFileModal';
import { RenameFolderModal } from './RenameFolderModal';
import { DeleteFileModal } from './DeleteFileModal';
import { DeleteFolderModal } from './DeleteFolderModal';
import { FilePreviewModal } from './FilePreviewModal';
import { ShareFileModal } from './ShareFileModal';
import { Button } from '../ui/Button';
import { useFilesByFolderId, useFilePublicUrl } from '../../hooks/useFiles';
import { useFoldersByParentId, useFolderById } from '../../hooks/useFolders';
import { useToast } from '../../contexts/ToastContext';
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
  
  
  // Estados para drag & drop
  const [isDragging, setIsDragging] = useState(false);
  const handleDragEnter = () => setIsDragging(true);
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = () => setIsDragging(false);
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
  
  const { 
    data: currentFolder 
  } = useFolderById(currentFolderId);
  
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
          const parentFolder = await useFolderById(parentId).refetch();
          if (parentFolder.data) {
            path.unshift(parentFolder.data);
            parentId = parentFolder.data.parent_id;
          } else {
            break;
          }
        }
        
        setBreadcrumbs(path);
      }
    };
    
    buildBreadcrumbs();
  }, [currentFolderId, currentFolder]);
  
  // Filtrado de archivos y carpetas por búsqueda
  // Aplicamos filtros adicionales según la vista (compartida o papelera)
  const filteredFolders = folders?.filter(folder => {
    // Solo filtro por búsqueda - mostrar todas las carpetas activas
    const matchesSearch = folder.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && !folder.deleted_at; // Solo excluir carpetas eliminadas
  }) || [];
  
  const filteredFiles = files?.filter(file => {
    // Solo filtro por búsqueda - mostrar todos los archivos activos
    const matchesSearch = file.filename.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && !file.deleted_at; // Solo excluir archivos eliminados
  }) || [];
  
  // Handlers para drag & drop
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    
    const element = dropAreaRef.current;
    if (element) {
      element.addEventListener('dragenter', handleDragEnter);
      element.addEventListener('dragleave', handleDragLeave);
      element.addEventListener('dragover', handleDragOver);
      element.addEventListener('drop', handleDrop);
      
      return () => {
        element.removeEventListener('dragenter', handleDragEnter);
        element.removeEventListener('dragleave', handleDragLeave);
        element.removeEventListener('dragover', handleDragOver);
        element.removeEventListener('drop', handleDrop);
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
  
  const handleFileDownload = (file: File) => {
    try {
      // Obtenemos la URL pública del archivo
      const { publicUrl } = useFilePublicUrl(file.storage_path || '');
      if (publicUrl) {
        // Creamos un enlace temporal para la descarga
        const link = document.createElement('a');
        link.href = publicUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showSuccess('Download started');
      } else {
        showError('Error', 'Cannot download the file. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      showError('Download Error', 'An error occurred while downloading the file. Please try again.');
    }
  };
  
  const handleShareFile = (file: File) => {
    setSelectedFile(file);
    setIsShareFileModalOpen(true);
  };
  
  // Renderizado condicional
  const isLoading = foldersLoading || filesLoading;
  const hasError = foldersError || filesError;
  const isEmpty = !isLoading && !hasError && filteredFolders.length === 0 && filteredFiles.length === 0;
  
  return (
    <div className="relative" ref={dropAreaRef}>
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
      {isDragging && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-90 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center z-10">
          <div className="text-center p-8 bg-white bg-opacity-80 rounded-lg shadow-sm">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-base font-medium text-slate-900 mb-2">Drop files here</h3>
            <p className="text-slate-600 text-sm">
              Drop your files to upload them to this folder
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
      
// ...
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
                  <div className="col-span-6">Name</div>
                  <div className="col-span-2">Modified</div>
                  <div className="col-span-2">Size</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                
                {/* Carpetas */}
                {filteredFolders.map((folder) => (
                  <div 
                    key={folder.id}
                    onClick={() => handleFolderClick(folder)}
                    className="grid grid-cols-12 items-center px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer group"
                  >
                    <div className="col-span-6 flex items-center gap-3">
                      <div className="p-1 bg-blue-50 rounded-md">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 19C22 19.5304 21.7893 20.0391 21.4142 20.4142C21.0391 20.7893 20.5304 21 20 21H4C3.46957 21 2.96086 20.7893 2.58579 20.4142C2.21071 20.0391 2 19.5304 2 19V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H9L11 6H20C20.5304 6 21.0391 6.21071 21.4142 6.58579C21.7893 6.96086 22 7.46957 22 8V19Z" fill="#3B82F6" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="font-medium text-slate-900 truncate">{folder.name}</h3>
                      </div>
                    </div>
                    <div className="col-span-2 text-sm text-slate-500">
                      {new Date(folder.created_at).toLocaleDateString()}
                    </div>
                    <div className="col-span-2 text-sm text-slate-500">
                      Folder
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <button 
                        className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-slate-100 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFolderRename(folder);
                        }}
                        aria-label="Folder options"
                      >
                        <MoreHorizontal className="h-4 w-4 text-slate-500" />
                      </button>
                      <button 
                        className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-slate-100 transition ml-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFolderDelete(folder);
                        }}
                        aria-label="Delete folder"
                      >
                        <svg className="h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
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
                  <div className="col-span-6">Name</div>
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
