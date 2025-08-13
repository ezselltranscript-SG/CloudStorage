import React from 'react';

// Definimos el tipo Activity aquí ya que no está disponible en el módulo analytics
export interface Activity {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface RecentActivityTableProps {
  activities: Activity[];
  isLoading?: boolean;
}

export const RecentActivityTable: React.FC<RecentActivityTableProps>;
