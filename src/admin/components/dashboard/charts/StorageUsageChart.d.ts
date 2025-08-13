import React from 'react';
import type { StorageStats } from '../../../types/analytics';

export interface StorageUsageChartProps {
  data?: StorageStats; // Make data optional since we're not using it
  topUsers: {
    userId: string;
    email: string;
    storageUsed: number;
    fileCount: number;
  }[];
}

export const StorageUsageChart: React.FC<StorageUsageChartProps>;
