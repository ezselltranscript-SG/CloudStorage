import React, { useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { useAdminFiles } from '../hooks/useAdminFiles';
import type { AdminFile } from '../types/admin-file';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  FileText, 
  Folder,
  User,
  Calendar,
  Trash2,
  Download,
  Eye,
  MoreHorizontal,
  Loader2
} from 'lucide-react';

export const FilesPage: React.FC = () => {
  // State for filters and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'file' | 'folder'>('all');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, /*setPageSize*/] = useState(20); // setPageSize comentado porque no se utiliza actualmente
  
  // Get files and folders with filters
  const { 
    files: items, 
    totalFiles: totalItems, 
    isLoading, 
    isError, 
    totalPages,
    hasNextPage,
    hasPreviousPage,
    softDeleteFile: deleteItem,
    isDeleting
  } = useAdminFiles({
    query: searchQuery,
    userId: selectedUser,
    page,
    pageSize
  });
  
  // Get users for filter dropdown
  const { users, isLoading: isLoadingUsers } = useAdminUsers({
    pageSize: 100, // Get a reasonable number of users for the dropdown
    sortBy: 'email',
    sortDirection: 'asc'
  });
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to first page when searching
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
  
  // Handle item deletion
  const handleDeleteItem = async (id: string, type: 'file' | 'folder') => {
    if (window.confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) {
      // softDeleteFile (renombrado como deleteItem) solo acepta un string como parámetro
      await deleteItem(id);
    }
  };
  
  // Handle toggling item access (public/private)
  // Esta función ya no se utiliza y toggleItemAccess no está disponible en el hook useAdminFiles
  // const handleToggleAccess = async (id: string, type: 'file' | 'folder', isPublic: boolean) => {
  //   await toggleItemAccess({ id, type, isPublic: !isPublic });
  // };
  
  // Function to format bytes to human readable format
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  // Function to format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <AdminLayout title="Files & Folders Management" requirePermission="manage_files">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Files & Folders Management</h1>
        
        <div className="mt-4 md:mt-0">
          {/* Botón de refrescar comentado porque refetch e isRefetching no están disponibles en el hook */}
          {/* <button
            onClick={() => {}}
            disabled={false}
            className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {false ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button> */}
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-medium text-slate-800">Filters</h2>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search files & folders..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                  </div>
                </div>
              </form>
            </div>
            
            {/* Type filter */}
            <div>
              <div className="relative">
                <select
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as 'all' | 'file' | 'folder')}
                >
                  <option value="all">All Types</option>
                  <option value="file">Files Only</option>
                  <option value="folder">Folders Only</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-slate-400" />
                </div>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                </div>
              </div>
            </div>
            
            {/* User filter */}
            <div>
              <div className="relative">
                <select
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  disabled={isLoadingUsers}
                >
                  <option value="">All Users</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                </div>
              </div>
            </div>
            
            {/* Date range */}
            <div className="relative">
              <input
                type="date"
                placeholder="From"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-slate-400" />
              </div>
            </div>
            
            <div className="relative">
              <input
                type="date"
                placeholder="To"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Files and folders table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Owner
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Size
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                      <span>Loading items...</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-red-500">
                    Error loading files and folders. Please try again.
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-slate-500">
                    No files or folders found matching your filters.
                  </td>
                </tr>
              ) : (
                items.map((item: AdminFile) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                          {item.type === 'folder' ? (
                            <Folder className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">
                            {item.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {/* La propiedad path no existe en el tipo AdminFile */}
                            {'-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* La propiedad owner no existe en el tipo AdminFile */}
                      <div className="text-sm text-slate-900">{'-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {item.type === 'file' ? formatBytes(item.size || 0) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* La propiedad isPublic no existe en el tipo AdminFile */}
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                        Private
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative inline-block text-left group">
                        <button className="text-slate-400 hover:text-slate-500 focus:outline-none">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                        
                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 hidden group-hover:block">
                          <div className="py-1">
                            <button
                              className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </button>
                            
                            {item.type === 'file' && (
                              <button
                                className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </button>
                            )}
                            
                            {/* Botón de toggle access comentado porque la funcionalidad ya no está disponible en el hook */}
                            {/* 
                            <button
                              onClick={() => handleToggleAccess(item.id, item.type, item.isPublic)}
                              disabled={isTogglingAccess}
                              className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            >
                              {item.isPublic ? (
                                <>
                                  <Lock className="h-4 w-4 mr-2" />
                                  Make Private
                                </>
                              ) : (
                                <>
                                  <Unlock className="h-4 w-4 mr-2" />
                                  Make Public
                                </>
                              )}
                            </button>
                            */}
                            
                            <button
                              onClick={() => handleDeleteItem(item.id, item.type as 'file' | 'folder')}
                              disabled={isDeleting}
                              className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-100"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!isLoading && !isError && items.length > 0 && (
          <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
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
                    {Math.min(page * pageSize, totalItems)}
                  </span>{' '}
                  of <span className="font-medium">{totalItems}</span> items
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
                            ? 'z-10 bg-primary border-primary text-white'
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
                            ? 'z-10 bg-primary border-primary text-white'
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
      </div>
    </AdminLayout>
  );
};
