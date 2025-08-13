import React from 'react';
import { 
  FileText, 
  Folder, 
  User, 
  Settings, 
  Shield, 
  AlertTriangle,
  Clock
} from 'lucide-react';

interface Activity {
  date: string;
  actionType: string;
  count: number;
}

interface RecentActivityTableProps {
  activities: Activity[];
}

export const RecentActivityTable: React.FC<RecentActivityTableProps> = ({ activities }) => {
  if (!activities.length) {
    return (
      <div className="p-6 text-center text-slate-500">
        No recent activity available
      </div>
    );
  }
  
  // Function to get icon based on action type
  const getActionIcon = (actionType: string) => {
    if (actionType.includes('file')) return <FileText className="h-4 w-4" />;
    if (actionType.includes('folder')) return <Folder className="h-4 w-4" />;
    if (actionType.includes('user')) return <User className="h-4 w-4" />;
    if (actionType.includes('setting')) return <Settings className="h-4 w-4" />;
    if (actionType.includes('role') || actionType.includes('permission')) return <Shield className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };
  
  // Function to format action type for display
  const formatActionType = (actionType: string) => {
    return actionType
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Function to format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Action
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Count
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
              Date
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {activities.map((activity, index) => (
            <tr key={index} className="hover:bg-slate-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                    {getActionIcon(activity.actionType)}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-slate-900">
                      {formatActionType(activity.actionType)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {activity.count} {activity.count === 1 ? 'time' : 'times'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">
                <div className="flex items-center justify-end">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDate(activity.date)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
