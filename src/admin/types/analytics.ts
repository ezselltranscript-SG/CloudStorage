/**
 * Analytics and dashboard data types
 */

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  newUsers: {
    last7Days: number;
    last30Days: number;
  };
  byRole: Record<string, number>; // Role name -> count
}

export interface StorageStats {
  totalStorage: number; // in bytes
  usedStorage: number; // in bytes
  fileCount: number;
  folderCount: number;
  topUsers: Array<{
    userId: string;
    email: string;
    storageUsed: number; // in bytes
    fileCount: number;
  }>;
}

export interface ActivityStats {
  dailyActiveUsers: Array<{
    date: string;
    count: number;
  }>;
  userSignups: Array<{
    date: string;
    count: number;
  }>;
  recentActions: Array<{
    date: string;
    actionType: string;
    count: number;
  }>;
}

export interface StatsTimeRange {
  startDate: string;
  endDate: string;
}

export interface DashboardStats {
  users: UserStats;
  storage: StorageStats;
  activity: ActivityStats;
  timeRange: StatsTimeRange;
}
