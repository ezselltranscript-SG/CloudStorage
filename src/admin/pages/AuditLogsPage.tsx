import React, { useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { useAdminAuditLogs } from '../hooks/useAdminAuditLogs';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  Calendar,
  Clock,
  User,
  FileText,
  Folder,
  Settings,
  Shield,
  AlertTriangle,
  Download,
  Loader2,
  RefreshCw,
  X
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  // State for filters and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, /*setPageSize*/] = useState(20); // Comentado porque no se utiliza
  
  // Get audit logs with filters
  const { 
    logs, 
    totalLogs, 
    isLoading, 
    isError, 
    totalPages,
    hasNextPage,
    hasPreviousPage,
    actionTypes,
    users,
    exportLogs,
    isExporting,
    refetch,
    isRefetching
  } = useAdminAuditLogs({
    query: searchQuery,
    actionType: selectedAction,
    userId: selectedUser,
    userIds: selectedUsers,
    startDate,
    endDate,
    page,
    pageSize
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
  
  // Handle export
  const handleExport = async () => {
    await exportLogs({
      query: searchQuery,
      actionType: selectedAction,
      userId: selectedUser,
      userIds: selectedUsers,
      startDate,
      endDate
    });
  };
  
  // Function to get icon based on action type
  const getActionIcon = (actionType: string) => {
    if (actionType.includes('file')) return <FileText className="h-4 w-4" />;
    if (actionType.includes('folder')) return <Folder className="h-4 w-4" />;
    if (actionType.includes('user')) return <User className="h-4 w-4" />;
    if (actionType.includes('setting')) return <Settings className="h-4 w-4" />;
    if (actionType.includes('role') || actionType.includes('permission')) return <Shield className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };
  
  // Function to format action type for display
  const formatActionType = (actionType: string) => {
    return actionType
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Function to format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  return (
    <AdminLayout title="Audit Logs" requirePermission="view_audit_logs">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Audit Logs</h1>
        
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button>
          
          <button
            onClick={handleExport}
            disabled={isExporting || isLoading || isError}
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Logs
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-medium text-slate-800">Filters</h2>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search logs..."
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
            
            {/* Action type filter */}
            <div>
              <div className="relative">
                <select
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                >
                  <option value="">All Actions</option>
                  {actionTypes.map((actionType) => (
                    <option key={actionType} value={actionType}>
                      {formatActionType(actionType)}
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
            
            {/* User filter (single) */}
            <div>
              <div className="relative">
                <select
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                  value={selectedUser}
                  onChange={(e) => {
                    setSelectedUser(e.target.value);
                    // Clear multi-user selection when single user is selected
                    if (e.target.value) {
                      setSelectedUsers([]);
                    }
                  }}
                >
                  <option value="">Single User</option>
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
            
            {/* Multi-user filter */}
            <div>
              <div className="relative">
                <select
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      // Clear single user selection when adding to multi-user selection
                      setSelectedUser('');
                      // Add to selected users if not already selected
                      if (!selectedUsers.includes(e.target.value)) {
                        setSelectedUsers([...selectedUsers, e.target.value]);
                      }
                      // Reset the select to empty value after selection
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">Add Multiple Users</option>
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
              
              {/* Selected users tags */}
              {selectedUsers.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedUsers.map(userId => {
                    const user = users.find(u => u.id === userId);
                    return (
                      <div key={userId} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800">
                        {user?.email || userId}
                        <button 
                          type="button"
                          onClick={() => setSelectedUsers(selectedUsers.filter(id => id !== userId))}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Date range */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="date"
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
      </div>
      
      {/* Logs table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Action
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Resource
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date & Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                      <span>Loading logs...</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-red-500">
                    Error loading audit logs. Please try again.
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-slate-500">
                    No audit logs found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                          {getActionIcon(log.actionType)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">
                            {formatActionType(log.actionType)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{log.actorEmail || 'System'}</div>
                      {log.actorId && (
                        <div className="text-xs text-slate-500">{log.actorId}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {log.targetType && `${log.targetType}${log.targetId ? `: ${log.targetId}` : ''}`}
                      </div>
                      {log.targetName && (
                        <div className="text-xs text-slate-500">{log.targetName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {log.ipAddress || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">
                      <div className="flex items-center justify-end">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(log.timestamp)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!isLoading && !isError && logs.length > 0 && (
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
                    {Math.min(page * pageSize, totalLogs)}
                  </span>{' '}
                  of <span className="font-medium">{totalLogs}</span> logs
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
