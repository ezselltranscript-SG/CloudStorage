import React, { useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { useAdminRoles } from '../hooks/useAdminRoles';
import { 
  Search, 
  Plus, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const UsersPage: React.FC = () => {
  // State for filters and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [showInactive, setShowInactive] = useState(false);
  const [showSuspended, setShowSuspended] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, /*setPageSize*/] = useState(10); // Comentado porque no se utiliza
  const [sortBy, setSortBy] = useState<'email' | 'createdAt' | 'lastLoginAt'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Get users with filters
  const { 
    users, 
    totalUsers, 
    isLoading, 
    isError, 
    totalPages,
    hasNextPage,
    hasPreviousPage,
    toggleUserSuspension,
    // isTogglingStatus no está disponible en el hook useAdminUsers
  } = useAdminUsers({
    query: searchQuery,
    role: selectedRole,
    isActive: showInactive ? undefined : true,
    isSuspended: showSuspended ? true : undefined,
    sortBy,
    sortDirection,
    page,
    pageSize
  });
  
  // Get roles for filter dropdown
  const { roles, isLoadingRoles } = useAdminRoles();
  
  // Handle sort change
  const handleSortChange = (column: 'email' | 'createdAt' | 'lastLoginAt') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };
  
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
  
  // Handle user suspension toggle
  const handleToggleSuspension = async (userId: string, currentStatus: boolean) => {
    await toggleUserSuspension({ userId, suspend: !currentStatus });
  };
  
  return (
    <AdminLayout title="User Management" requirePermission="view_users">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
        
        <div className="mt-4 md:mt-0">
          <Link 
            to="/admin/users/new"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New User
          </Link>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-medium text-slate-800">Filters</h2>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search users..."
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
            
            {/* Role filter */}
            <div>
              <div className="relative">
                <select
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={isLoadingRoles}
                >
                  <option value="">All Roles</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-slate-400" />
                </div>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                </div>
              </div>
            </div>
            
            {/* Status filters */}
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-primary focus:ring-primary"
                  checked={showInactive}
                  onChange={() => setShowInactive(!showInactive)}
                />
                <span className="ml-2 text-sm text-slate-700">Show Inactive</span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-primary focus:ring-primary"
                  checked={showSuspended}
                  onChange={() => setShowSuspended(!showSuspended)}
                />
                <span className="ml-2 text-sm text-slate-700">Show Suspended</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Users table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('email')}
                >
                  <div className="flex items-center">
                    User
                    {sortBy === 'email' && (
                      sortDirection === 'asc' ? 
                        <ChevronUp className="h-4 w-4 ml-1" /> : 
                        <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Role
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('createdAt')}
                >
                  <div className="flex items-center">
                    Created
                    {sortBy === 'createdAt' && (
                      sortDirection === 'asc' ? 
                        <ChevronUp className="h-4 w-4 ml-1" /> : 
                        <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('lastLoginAt')}
                >
                  <div className="flex items-center">
                    Last Login
                    {sortBy === 'lastLoginAt' && (
                      sortDirection === 'asc' ? 
                        <ChevronUp className="h-4 w-4 ml-1" /> : 
                        <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
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
                      <span>Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-red-500">
                    Error loading users. Please try again.
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-slate-500">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                          {user.firstName ? user.firstName.charAt(0) : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-slate-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {user.roles?.map(role => role.name).join(', ') || 'No role'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isSuspended ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Suspended
                        </span>
                      ) : user.isActive ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative inline-block text-left group">
                        <button className="text-slate-400 hover:text-slate-500 focus:outline-none">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                        
                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 hidden group-hover:block">
                          <div className="py-1">
                            <Link
                              to={`/admin/users/${user.id}`}
                              className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                            
                            <button
                              onClick={() => handleToggleSuspension(user.id, !!user.isSuspended)}
                              // isTogglingStatus no está disponible en el hook useAdminUsers
                              // disabled={isTogglingStatus}
                              className="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
                              style={{ color: user.isSuspended ? '#10b981' : '#ef4444' }}
                            >
                              {user.isSuspended ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Reactivate
                                </>
                              ) : (
                                <>
                                  <Ban className="h-4 w-4 mr-2" />
                                  Suspend
                                </>
                              )}
                            </button>
                            
                            <button
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
        {!isLoading && !isError && users.length > 0 && (
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
                    {Math.min(page * pageSize, totalUsers)}
                  </span>{' '}
                  of <span className="font-medium">{totalUsers}</span> users
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
