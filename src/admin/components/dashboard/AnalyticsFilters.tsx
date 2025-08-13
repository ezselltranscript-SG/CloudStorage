import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface DateRange {
  start: Date;
  end: Date;
}

interface AnalyticsFiltersProps {
  onDateRangeChange: (range: DateRange) => void;
  onUserFilterChange?: (userId: string | null) => void;
  onTeamFilterChange?: (teamId: string | null) => void;
  users?: Array<{ id: string; name: string }>;
  teams?: Array<{ id: string; name: string }>;
}

/**
 * Component for filtering analytics data by date range, user, and team
 */
export const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  onDateRangeChange,
  onUserFilterChange,
  onTeamFilterChange,
  users = [],
  teams = []
}) => {
  // Predefined date ranges
  const dateRanges = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
    { label: 'This month', value: 'month' },
    { label: 'This quarter', value: 'quarter' },
    { label: 'This year', value: 'year' },
    { label: 'Custom', value: 'custom' }
  ];
  
  const [selectedRange, setSelectedRange] = useState('30d');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  
  // Calculate date range based on selection
  const calculateDateRange = (rangeValue: string): DateRange => {
    const end = new Date();
    let start = new Date();
    
    switch (rangeValue) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case 'month':
        start = new Date(end.getFullYear(), end.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(end.getMonth() / 3);
        start = new Date(end.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        start = new Date(end.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            start: new Date(customStartDate),
            end: new Date(customEndDate)
          };
        }
        // Default to last 30 days if custom dates are not set
        start.setDate(end.getDate() - 30);
        break;
    }
    
    return { start, end };
  };
  
  // Handle date range change
  const handleRangeChange = (rangeValue: string) => {
    setSelectedRange(rangeValue);
    
    if (rangeValue !== 'custom') {
      const range = calculateDateRange(rangeValue);
      onDateRangeChange(range);
    }
    
    setIsDatePickerOpen(rangeValue === 'custom');
  };
  
  // Handle custom date range change
  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (customStartDate && customEndDate) {
      const range = {
        start: new Date(customStartDate),
        end: new Date(customEndDate)
      };
      
      onDateRangeChange(range);
      setIsDatePickerOpen(false);
    }
  };
  
  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get current date range display
  const getCurrentRangeDisplay = (): string => {
    const range = calculateDateRange(selectedRange);
    return `${formatDate(range.start)} - ${formatDate(range.end)}`;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        {/* Date range selector */}
        <div className="relative">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-slate-500" />
            <div className="relative">
              <button
                type="button"
                className="flex items-center space-x-2 px-3 py-2 border border-slate-300 rounded-md bg-white text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              >
                <span>{getCurrentRangeDisplay()}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {isDatePickerOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-md shadow-lg z-10">
                  <div className="p-2">
                    {/* Predefined ranges */}
                    <div className="mb-2">
                      {dateRanges.map(range => (
                        <button
                          key={range.value}
                          type="button"
                          className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                            selectedRange === range.value
                              ? 'bg-blue-50 text-blue-700'
                              : 'hover:bg-slate-100'
                          }`}
                          onClick={() => handleRangeChange(range.value)}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom date picker */}
                    {selectedRange === 'custom' && (
                      <form onSubmit={handleCustomDateSubmit} className="border-t border-slate-200 pt-2">
                        <div className="mb-2">
                          <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={e => setCustomStartDate(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded-md text-sm"
                            required
                          />
                        </div>
                        <div className="mb-2">
                          <label className="block text-xs text-slate-500 mb-1">End Date</label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={e => setCustomEndDate(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded-md text-sm"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                        >
                          Apply
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Additional filters */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {/* User filter */}
          {users.length > 0 && onUserFilterChange && (
            <div>
              <select
                className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm text-slate-700"
                onChange={e => onUserFilterChange(e.target.value || null)}
                defaultValue=""
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Team filter */}
          {teams.length > 0 && onTeamFilterChange && (
            <div>
              <select
                className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm text-slate-700"
                onChange={e => onTeamFilterChange(e.target.value || null)}
                defaultValue=""
              >
                <option value="">All Teams</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
