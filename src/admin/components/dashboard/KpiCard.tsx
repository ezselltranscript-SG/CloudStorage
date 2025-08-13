import React from 'react';
import type { ReactNode } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: number;
  changeLabel?: string;
  isLoading?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

/**
 * Card component for displaying KPI metrics on the admin dashboard
 */
export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon,
  change,
  changeLabel = 'vs last period',
  isLoading = false,
  trend = 'neutral',
  className = ''
}) => {
  // Get trend icon and color
  const getTrendStyles = () => {
    switch (trend) {
      case 'up':
        return {
          icon: <ArrowUp className="h-4 w-4" />,
          textColor: 'text-green-600',
          bgColor: 'bg-green-100'
        };
      case 'down':
        return {
          icon: <ArrowDown className="h-4 w-4" />,
          textColor: 'text-red-600',
          bgColor: 'bg-red-100'
        };
      case 'neutral':
      default:
        return {
          icon: <Minus className="h-4 w-4" />,
          textColor: 'text-slate-600',
          bgColor: 'bg-slate-100'
        };
    }
  };
  
  const trendStyles = getTrendStyles();
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 p-5 ${className}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-slate-500">{title}</h3>
          
          {isLoading ? (
            <div className="mt-2 h-8 w-24 bg-slate-200 animate-pulse rounded"></div>
          ) : (
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold text-slate-900">{value}</p>
            </div>
          )}
        </div>
        
        <div className="p-2 rounded-full bg-slate-100">
          {icon}
        </div>
      </div>
      
      {!isLoading && change !== undefined && (
        <div className="mt-4 flex items-center">
          <div className={`flex items-center ${trendStyles.textColor} text-sm`}>
            <div className={`mr-1 p-1 rounded-full ${trendStyles.bgColor}`}>
              {trendStyles.icon}
            </div>
            <span>{Math.abs(change)}%</span>
          </div>
          <span className="text-slate-500 text-sm ml-2">{changeLabel}</span>
        </div>
      )}
    </div>
  );
};
