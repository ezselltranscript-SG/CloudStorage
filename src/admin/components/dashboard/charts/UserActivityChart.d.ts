import React from 'react';
import type { ActivityStats } from '../../../types/analytics';

export interface UserActivityChartProps {
  data: ActivityStats;
}

export const UserActivityChart: React.FC<UserActivityChartProps>;
