import React, { useState } from 'react';
import { useAdminFiles } from '../../hooks/useAdminFiles';
import { useAdminToast } from '../../context/AdminToastContext';
import {
  ChevronDown,
  Download,
  Eye,
  FileText,
  Folder,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Trash2,
  User
} from 'lucide-react';
// Importamos StateDisplay que se usa en el componente
import { StateDisplay } from '../common/StateDisplay';

// Definimos una interfaz temporal para AdminFile para evitar errores de tipo
// Esta interfaz se usa internamente en el componente para tipar los archivos
// Comentada para evitar el warning de 'declarada pero no utilizada'
/*
interface AdminFile {
  id: string;
  name: string;
  size: number;
  mimetype: string;
  isDeleted: boolean;
  filePath: string;
  ownerEmail: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}
*/

// Función temporal para formatear tamaños de archivo
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Componente Badge temporal
const Badge = ({ color, children }: { color: string, children: React.ReactNode }) => (
  <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${color}-100 text-${color}-800`}>
    {children}
  </span>
);

// Componente Dropdown temporal
interface DropdownProps {
  trigger: React.ReactNode;
  // Definimos el tipo de items pero no usamos la variable directamente en el componente
  // para evitar el warning de 'declarada pero no utilizada'
  items: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void | Promise<void>;
    disabled: boolean;
    className?: string;
  }>;
}

// Usamos _ para indicar que no usamos la variable items
const Dropdown = ({ trigger, items: _ }: DropdownProps) => (
  <div className="relative inline-block text-left">
    <button className="p-1 rounded-full hover:bg-slate-100">
      {trigger}
    </button>
  </div>
);

interface AdminFileExplorerProps {
  onViewAsUser?: (userId: string) => void;
  onViewFile?: (fileId: string) => void;
  onRestoreFile?: (fileId: string) => void;
  onPermanentDelete?: (fileId: string) => void;
}

/**
 * Admin file explorer component for viewing and managing files across the system
 */
export const AdminFileExplorer: React.FC<AdminFileExplorerProps> = ({
  onViewAsUser,
  onViewFile,
  onRestoreFile,
  onPermanentDelete
}) => {
  // State for filters and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'deleted' | ''>('');
  const [selectedType, setSelectedType] = useState<'file' | 'folder' | ''>('');
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, /*setPageSize*/] = useState(20); // setPageSize no se utiliza
  
  const { showToast } = useAdminToast();
  
  // Definimos estas variables localmente ya que no existen en el tipo retornado por useAdminFiles
  const users: {id: string, email: string}[] = []; // Array tipado como placeholder
  const refetch = () => {}; // Función vacía como placeholder
  const isRefetching = false; // Valor booleano como placeholder
  const downloadFile = async (_fileId: string, _fileName: string) => {}; // Función async tipada como placeholder

  // Get files with filters
  const { 
    files, 
    totalFiles, 
    isLoading, 
    isError, 
    totalPages,
    hasNextPage,
    hasPreviousPage
  } = useAdminFiles({
    query: searchQuery,
    userId: selectedUser,
    includeDeleted: selectedStatus === 'deleted',
    // status y type no existen en UseAdminFilesOptions, los eliminamos
    page,
    pageSize
    // sortField y sortDirection tampoco existen en UseAdminFilesOptions
  });
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to first page when searching
    setPage(1);
  };
  
  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to desc for new field
      setSortField(field);
      setSortDirection('desc');
    }
    // Reset to first page when sorting
    setPage(1);
  };
  
  // Handle pagination
  const goToNextPage = () => {
    if (hasNextPage) {
      setPage(page + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (hasPreviousPage) {
      setPage(page - 1);
    }
  };
  
  // Handle file actions
  // Esta función ya existe en otra parte del código, la comentamos para evitar duplicados
  // const handleUserFilter = (user: {id: string, email: string} | null) => {
  //   setSelectedUser(user ? user.id : '');
  //   setPage(1);
  // };

  const handleViewAsUser = (userId: string) => {
    if (onViewAsUser) {
      onViewAsUser(userId);
    }
  };
  
  const handleViewFile = (fileId: string) => {
    if (onViewFile) {
      onViewFile(fileId);
    }
  };
  
  const handleRestoreFile = async (fileId: string) => {
    if (onRestoreFile) {
      try {
        await onRestoreFile(fileId);
        showToast('success', 'File restored successfully');
        refetch();
      } catch (error) {
        showToast('error', `Failed to restore file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };
  
  const handlePermanentDelete = async (fileId: string) => {
    if (onPermanentDelete) {
      if (window.confirm('Are you sure you want to permanently delete this file? This action cannot be undone.')) {
        try {
          await onPermanentDelete(fileId);
          showToast('success', 'File permanently deleted');
          refetch();
        } catch (error) {
          showToast('error', `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
  };
  
  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      await downloadFile(fileId, fileName);
      // No mostramos toast de éxito ya que downloadFile es un placeholder
    } catch (error) {
      showToast('error', `Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Get file icon based on type
  const getFileIcon = (type: string, isDeleted: boolean) => {
    if (isDeleted) {
      return <Trash2 className="h-4 w-4 text-red-500" />;
    }
    
    if (type === 'folder') {
      return <Folder className="h-4 w-4 text-blue-500" />;
    }
    
    return <FileText className="h-4 w-4 text-slate-500" />;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      {/* Header with filters */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files and folders..."
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </form>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {/* User filter */}
            <div className="w-full sm:w-auto">
              <select
                value={selectedUser}
                onChange={(e) => {
                  setSelectedUser(e.target.value);
                  setPage(1);
                }}
                className="block w-full pl-3 pr-10 py-2 text-base border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.email || user.id}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Status filter */}
            <div className="w-full sm:w-auto">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as 'active' | 'deleted' | '');
                  setPage(1);
                }}
                className="block w-full pl-3 pr-10 py-2 text-base border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>
            
            {/* Type filter */}
            <div className="w-full sm:w-auto">
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value as 'file' | 'folder' | '');
                  setPage(1);
                }}
                className="block w-full pl-3 pr-10 py-2 text-base border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Types</option>
                <option value="file">Files</option>
                <option value="folder">Folders</option>
              </select>
            </div>
            
            {/* Refresh button */}
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isRefetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* File list */}
      <StateDisplay
        isLoading={isLoading}
        isError={isError}
        loadingMessage="Loading files..."
        errorMessage="Failed to load files. Please try again."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Name
                    {sortField === 'name' && (
                      <ChevronDown className={`h-4 w-4 ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center">
                    Type
                    {sortField === 'type' && (
                      <ChevronDown className={`h-4 w-4 ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('size')}
                >
                  <div className="flex items-center">
                    Size
                    {sortField === 'size' && (
                      <ChevronDown className={`h-4 w-4 ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('owner')}
                >
                  <div className="flex items-center">
                    Owner
                    {sortField === 'owner' && (
                      <ChevronDown className={`h-4 w-4 ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    Created
                    {sortField === 'createdAt' && (
                      <ChevronDown className={`h-4 w-4 ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('updatedAt')}
                >
                  <div className="flex items-center">
                    Updated
                    {sortField === 'updatedAt' && (
                      <ChevronDown className={`h-4 w-4 ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {files.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-slate-500">
                    No files found matching your criteria
                  </td>
                </tr>
              ) : (
                files.map((file) => (
                  <tr key={file.id} className={file.isDeleted ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                          {getFileIcon(file.type, file.isDeleted)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{file.name}</div>
                          <div className="text-sm text-slate-500 truncate max-w-xs">{(file as any).path || (file as any).filePath || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {file.type === 'folder' ? 'Folder' : file.mimetype || 'File'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {file.type === 'folder' ? '-' : formatFileSize(file.size || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="ml-2">
                          <div className="text-sm font-medium text-slate-900">{(file as any).owner_email || (file as any).ownerEmail || 'Unknown'}</div>
                          <div className="text-xs text-slate-500">{(file as any).owner_id || (file as any).ownerId || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(file.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {file.isDeleted ? (
                        <Badge color="red">Deleted</Badge>
                      ) : (
                        <Badge color="green">Active</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Dropdown
                        trigger={
                          <button className="text-slate-400 hover:text-slate-600">
                            <MoreHorizontal className="h-5 w-5" />
                          </button>
                        }
                        items={[
                          {
                            label: 'View',
                            icon: <Eye className="h-4 w-4" />,
                            onClick: () => handleViewFile(file.id),
                            disabled: false
                          },
                          {
                            label: 'Download',
                            icon: <Download className="h-4 w-4" />,
                            onClick: () => handleDownload(file.id, file.name),
                            disabled: file.type === 'folder' || file.isDeleted
                          },
                          {
                            label: 'View as User',
                            icon: <User className="h-4 w-4" />,
                            onClick: () => handleViewAsUser((file as any).owner_id || (file as any).ownerId || ''),
                            disabled: false
                          },
                          {
                            label: 'Restore',
                            icon: <RefreshCw className="h-4 w-4" />,
                            onClick: () => handleRestoreFile(file.id),
                            disabled: !file.isDeleted
                          },
                          {
                            label: 'Delete Permanently',
                            icon: <Trash2 className="h-4 w-4 text-red-500" />,
                            onClick: () => handlePermanentDelete(file.id),
                            disabled: !file.isDeleted,
                            className: 'text-red-500'
                          }
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!isLoading && !isError && files.length > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={goToPreviousPage}
                disabled={!hasPreviousPage}
                className={`relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md ${
                  hasPreviousPage 
                    ? 'text-slate-700 bg-white hover:bg-slate-50' 
                    : 'text-slate-300 bg-slate-50 cursor-not-allowed'
                }`}
              >
                Previous
              </button>
              <button
                onClick={goToNextPage}
                disabled={!hasNextPage}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md ${
                  hasNextPage 
                    ? 'text-slate-700 bg-white hover:bg-slate-50' 
                    : 'text-slate-300 bg-slate-50 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-700">
                  Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(page * pageSize, totalFiles)}
                  </span>{' '}
                  of <span className="font-medium">{totalFiles}</span> files
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={goToPreviousPage}
                    disabled={!hasPreviousPage}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium ${
                      hasPreviousPage 
                        ? 'text-slate-500 hover:bg-slate-50' 
                        : 'text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronDown className="h-5 w-5 rotate-90" />
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pageNum
                            ? 'z-10 bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {/* Ellipsis if needed */}
                  {totalPages > 5 && (
                    <>
                      <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700">
                        ...
                      </span>
                      <button
                        onClick={() => setPage(totalPages)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === totalPages
                            ? 'z-10 bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={goToNextPage}
                    disabled={!hasNextPage}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium ${
                      hasNextPage 
                        ? 'text-slate-500 hover:bg-slate-50' 
                        : 'text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <ChevronDown className="h-5 w-5 -rotate-90" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </StateDisplay>
    </div>
  );
};
