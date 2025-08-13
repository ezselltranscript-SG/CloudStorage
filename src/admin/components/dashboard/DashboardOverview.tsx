import React, { useState } from 'react';
import { 
  Users, 
  HardDrive, 
  FileText, 
  UserPlus, 
  Calendar, 
  Loader2
} from 'lucide-react';
import { useAdminAnalytics } from '../../hooks/useAdminAnalytics';
// Importaciones con rutas relativas completas
import { StatsCard } from '../../components/dashboard/StatsCard';
import { StorageUsageChart } from '../../components/dashboard/charts/StorageUsageChart';
import { UserActivityChart } from '../../components/dashboard/charts/UserActivityChart';
import { TopUsersTable } from '../../components/dashboard/tables/TopUsersTable';
import { RecentActivityTable } from '../../components/dashboard/tables/RecentActivityTable';

export const DashboardOverview: React.FC = () => {
  const [timeRange] = useState<{ startDate: string; endDate: string }>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    endDate: new Date().toISOString()
  });
  
  const { 
    dashboardStats, 
    isLoadingDashboard,
    isErrorDashboard
  } = useAdminAnalytics(timeRange);
  
  if (isLoadingDashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg text-slate-600">Loading dashboard data...</span>
      </div>
    );
  }
  
  if (isErrorDashboard || !dashboardStats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <h3 className="text-lg font-medium">Error loading dashboard data</h3>
        <p>There was a problem fetching the dashboard statistics. Please try again later.</p>
      </div>
    );
  }
  
  const { users, storage, activity } = dashboardStats;
  
  // Calculate percentage changes for KPIs
  const userGrowth = users.totalUsers > 0 
    ? (users.newUsers.last7Days / users.totalUsers) * 100 
    : 0;
  
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={users.totalUsers}
          icon={<Users className="h-6 w-6" />}
          change={userGrowth}
          changeLabel={`${users.newUsers.last7Days} new in last 7 days`}
          trend={userGrowth > 0 ? 'up' : 'down'}
        />
        
        <StatsCard
          title="Storage Used"
          value={`${(storage.usedStorage / (1024 * 1024 * 1024)).toFixed(2)} GB`}
          icon={<HardDrive className="h-6 w-6" />}
          change={0} // Would calculate from historical data
          changeLabel={`${storage.fileCount} files`}
          trend="neutral"
        />
        
        <StatsCard
          title="Total Folders"
          value={storage.folderCount}
          icon={<FileText className="h-6 w-6" />}
          change={0} // Would calculate from historical data
          changeLabel="Across all users"
          trend="neutral"
        />
        
        <StatsCard
          title="Active Users"
          value={users.activeUsers}
          icon={<UserPlus className="h-6 w-6" />}
          change={(users.activeUsers / users.totalUsers) * 100}
          changeLabel={`${((users.activeUsers / users.totalUsers) * 100).toFixed(0)}% of total`}
          trend="up"
        />
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Storage Usage Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-slate-800">Storage Usage</h3>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-slate-500" />
              <span className="text-sm text-slate-500">Last 30 days</span>
            </div>
          </div>
          <StorageUsageChart data={storage} topUsers={storage.topUsers} />
        </div>
        
        {/* User Activity Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-slate-800">User Activity</h3>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-slate-500" />
              <span className="text-sm text-slate-500">Last 30 days</span>
            </div>
          </div>
          <UserActivityChart data={activity} />
        </div>
      </div>
      
      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users by Storage */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-medium text-slate-800">Top Users by Storage</h3>
          </div>
          <TopUsersTable users={storage.topUsers} />
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-medium text-slate-800">Recent Activity</h3>
          </div>
          <RecentActivityTable activities={activity.recentActions.slice(0, 5)} />
        </div>
      </div>
    </div>
  );
};
