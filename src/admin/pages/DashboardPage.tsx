import React, { useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { DashboardOverview } from '../components/dashboard/DashboardOverview';
import { Calendar } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  return (
    <AdminLayout title="Dashboard" requirePermission="view_dashboard">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <div className="flex items-center bg-white rounded-md border border-slate-200 shadow-sm">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1.5 text-sm font-medium rounded-l-md ${
                timeRange === '7d' 
                  ? 'bg-primary text-white' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              7 days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1.5 text-sm font-medium ${
                timeRange === '30d' 
                  ? 'bg-primary text-white' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              30 days
            </button>
            <button
              onClick={() => setTimeRange('90d')}
              className={`px-3 py-1.5 text-sm font-medium rounded-r-md ${
                timeRange === '90d' 
                  ? 'bg-primary text-white' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              90 days
            </button>
          </div>
          
          <button className="flex items-center px-3 py-1.5 text-sm font-medium bg-white border border-slate-200 rounded-md shadow-sm text-slate-600 hover:bg-slate-50">
            <Calendar className="h-4 w-4 mr-1" />
            Custom Range
          </button>
        </div>
      </div>
      
      {/* Dashboard content */}
      <DashboardOverview />
    </AdminLayout>
  );
};
