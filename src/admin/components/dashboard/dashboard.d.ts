import { ReactNode } from 'react';

// StatsCard component types
export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change: number;
  changeLabel: string;
  trend: 'up' | 'down' | 'neutral';
}

export const StatsCard: React.FC<StatsCardProps>;

// UserActivityChart component types
export interface UserActivityChartProps {
  data?: any[];
  isLoading?: boolean;
}

export const UserActivityChart: React.FC<UserActivityChartProps>;

// StorageUsageChart component types
export interface StorageUsageChartProps {
  data?: any[];
  isLoading?: boolean;
}

export const StorageUsageChart: React.FC<StorageUsageChartProps>;

// RecentActivityTable component types
export interface RecentActivityTableProps {
  data?: any[];
  isLoading?: boolean;
}

export const RecentActivityTable: React.FC<RecentActivityTableProps>;

// TopUsersTable component types
export interface TopUsersTableProps {
  data?: any[];
  isLoading?: boolean;
}

export const TopUsersTable: React.FC<TopUsersTableProps>;
