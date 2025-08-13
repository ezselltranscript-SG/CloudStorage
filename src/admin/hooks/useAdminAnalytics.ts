/**
 * Hook for analytics in admin dashboard
 */

import { useQuery } from '@tanstack/react-query';
import type { DashboardStats, StatsTimeRange } from '../types/analytics';
import { analyticsService } from '../services/analytics-service';

export function useAdminAnalytics(timeRange: StatsTimeRange) {
  // Query to fetch dashboard stats
  const dashboardStatsQuery = useQuery<DashboardStats>({
    queryKey: ['adminDashboardStats', timeRange],
    queryFn: () => analyticsService.getDashboardStats(timeRange)
  });
  
  // Query to fetch user stats
  const userStatsQuery = useQuery({
    queryKey: ['adminUserStats'],
    queryFn: () => analyticsService.getUserStats()
  });
  
  // Query to fetch storage stats
  const storageStatsQuery = useQuery({
    queryKey: ['adminStorageStats'],
    queryFn: () => analyticsService.getStorageStats()
  });
  
  // Query to fetch activity stats
  const activityStatsQuery = useQuery({
    queryKey: ['adminActivityStats', timeRange],
    queryFn: () => analyticsService.getActivityStats(timeRange)
  });
  
  return {
    // Dashboard stats (all in one)
    dashboardStats: dashboardStatsQuery.data,
    isLoadingDashboard: dashboardStatsQuery.isLoading,
    isErrorDashboard: dashboardStatsQuery.isError,
    errorDashboard: dashboardStatsQuery.error,
    
    // Individual stats
    userStats: userStatsQuery.data,
    isLoadingUsers: userStatsQuery.isLoading,
    isErrorUsers: userStatsQuery.isError,
    errorUsers: userStatsQuery.error,
    
    storageStats: storageStatsQuery.data,
    isLoadingStorage: storageStatsQuery.isLoading,
    isErrorStorage: storageStatsQuery.isError,
    errorStorage: storageStatsQuery.error,
    
    activityStats: activityStatsQuery.data,
    isLoadingActivity: activityStatsQuery.isLoading,
    isErrorActivity: activityStatsQuery.isError,
    errorActivity: activityStatsQuery.error,
    
    // Refetch helpers
    refetchAll: () => {
      dashboardStatsQuery.refetch();
      userStatsQuery.refetch();
      storageStatsQuery.refetch();
      activityStatsQuery.refetch();
    }
  };
}
