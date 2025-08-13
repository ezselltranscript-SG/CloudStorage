import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import type { ActivityStats } from '../../../types/analytics';

interface UserActivityChartProps {
  data: ActivityStats;
}

export const UserActivityChart: React.FC<UserActivityChartProps> = ({ data }) => {
  // Prepare data for the chart
  // We need to merge dailyActiveUsers and userSignups by date
  const mergedData = new Map();
  
  // Process daily active users
  data.dailyActiveUsers.forEach(item => {
    if (!mergedData.has(item.date)) {
      mergedData.set(item.date, { date: item.date });
    }
    mergedData.get(item.date).activeUsers = item.count;
  });
  
  // Process user signups
  data.userSignups.forEach(item => {
    if (!mergedData.has(item.date)) {
      mergedData.set(item.date, { date: item.date });
    }
    mergedData.get(item.date).newUsers = item.count;
  });
  
  // Convert to array and sort by date
  const chartData = Array.from(mergedData.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
  
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            labelFormatter={(label) => {
              const date = new Date(label as string);
              return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              });
            }}
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e2e8f0',
              borderRadius: '0.375rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="activeUsers"
            name="Active Users"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="newUsers"
            name="New Signups"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
