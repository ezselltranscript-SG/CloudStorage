import React, { useState } from 'react';
import type { StorageStats, ActivityStats } from '../../types/analytics';
import { AnalyticsFilters } from './AnalyticsFilters';
import { KpiCard } from './KpiCard';
import { StorageUsageChart } from './charts/StorageUsageChart';
import { UserActivityChart } from './charts/UserActivityChart';
import { StateDisplay } from '../common/StateDisplay';
import { 
  Users, 
  HardDrive, 
  FileText, 
  Upload, 
  Download 
  // Clock no se utiliza
} from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalStorage: number;
  usedStorage: number;
  totalFiles: number;
  totalFolders: number;
  uploads: number;
  downloads: number;
  userGrowth: number;
  storageGrowth: number;
  activityGrowth: number;
  storageUsageData: StorageStats;
  userActivityData: ActivityStats;
}

interface AnalyticsDashboardProps {
  data?: AnalyticsData;
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => void;
}

/**
 * Main component for displaying analytics dashboard with KPIs and charts
 */
export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  data,
  isLoading,
  isError,
  onRefresh
}) => {
  // dateRange no se utiliza directamente, solo a través de setDateRange
  const [/*dateRange*/, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date()
  });
  
  // Format storage size
  const formatStorageSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Calculate storage usage percentage
  const calculateStoragePercentage = (): number => {
    if (!data) return 0;
    return Math.round((data.usedStorage / data.totalStorage) * 100);
  };
  
  // Handle date range change
  const handleDateRangeChange = (range: { start: Date; end: Date }) => {
    setDateRange(range);
    // In a real implementation, this would trigger a data refresh with the new date range
    onRefresh();
  };
  
  return (
    <div>
      {/* Filters */}
      <AnalyticsFilters onDateRangeChange={handleDateRangeChange} />
      
      {/* Main content */}
      <StateDisplay
        isLoading={isLoading}
        isError={isError}
        loadingMessage="Loading analytics data..."
        errorMessage="Failed to load analytics data. Please try again."
      >
        {data && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <KpiCard
                title="Total Users"
                value={data.totalUsers}
                icon={<Users className="h-5 w-5 text-blue-600" />}
                change={data.userGrowth}
                trend={data.userGrowth > 0 ? 'up' : data.userGrowth < 0 ? 'down' : 'neutral'}
              />
              
              <KpiCard
                title="Active Users"
                value={`${data.activeUsers} (${Math.round((data.activeUsers / data.totalUsers) * 100)}%)`}
                icon={<Users className="h-5 w-5 text-green-600" />}
              />
              
              <KpiCard
                title="Storage Usage"
                value={`${formatStorageSize(data.usedStorage)} / ${formatStorageSize(data.totalStorage)}`}
                icon={<HardDrive className="h-5 w-5 text-purple-600" />}
                change={data.storageGrowth}
                trend={data.storageGrowth > 0 ? 'up' : data.storageGrowth < 0 ? 'down' : 'neutral'}
              />
              
              <KpiCard
                title="Total Files"
                value={data.totalFiles}
                icon={<FileText className="h-5 w-5 text-yellow-600" />}
              />
              
              <KpiCard
                title="Uploads"
                value={data.uploads}
                icon={<Upload className="h-5 w-5 text-indigo-600" />}
                change={data.activityGrowth}
                trend={data.activityGrowth > 0 ? 'up' : data.activityGrowth < 0 ? 'down' : 'neutral'}
              />
              
              <KpiCard
                title="Downloads"
                value={data.downloads}
                icon={<Download className="h-5 w-5 text-cyan-600" />}
              />
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Storage Usage Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Storage Usage</h3>
                <div className="h-80">
                  <StorageUsageChart data={data.storageUsageData} topUsers={data.storageUsageData.topUsers} />
                </div>
              </div>
              
              {/* User Activity Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                <h3 className="text-lg font-medium text-slate-800 mb-4">User Activity</h3>
                <div className="h-80">
                  <UserActivityChart data={data.userActivityData} />
                </div>
              </div>
            </div>
            
            {/* Storage Usage Progress */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-slate-800">Storage Usage</h3>
                <span className="text-sm text-slate-500">
                  {formatStorageSize(data.usedStorage)} of {formatStorageSize(data.totalStorage)} used
                </span>
              </div>
              
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${calculateStoragePercentage()}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        )}
      </StateDisplay>
    </div>
  );
};
