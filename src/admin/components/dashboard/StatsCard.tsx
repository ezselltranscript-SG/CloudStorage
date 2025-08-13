import React from 'react';
import type { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change: number;
  changeLabel: string;
  trend: 'up' | 'down' | 'neutral';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  change,
  changeLabel,
  trend
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-semibold mt-1">{value}</h3>
        </div>
        <div className="p-2 bg-primary/10 rounded-full text-primary">
          {icon}
        </div>
      </div>
      
      <div className="mt-4 flex items-center">
        {trend === 'up' && (
          <div className="flex items-center text-emerald-600">
            <ArrowUpRight className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium">{change.toFixed(1)}%</span>
          </div>
        )}
        
        {trend === 'down' && (
          <div className="flex items-center text-red-600">
            <ArrowDownRight className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium">{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
        
        {trend === 'neutral' && (
          <div className="flex items-center text-slate-500">
            <Minus className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium">0%</span>
          </div>
        )}
        
        <span className="text-xs text-slate-500 ml-2">{changeLabel}</span>
      </div>
    </div>
  );
};
