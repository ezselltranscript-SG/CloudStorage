/**
 * Analytics service for admin dashboard
 */

import { AdminServiceBase } from './admin-service-base';
import type { ActivityStats, DashboardStats, StatsTimeRange, StorageStats, UserStats } from '../types/analytics';
import { adminFileService } from './admin-file-service';

export class AnalyticsService extends AdminServiceBase {
  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    try {
      // Get total users
      const { count: totalUsers, error: totalError } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (totalError) throw totalError;
      
      // Get active users
      const { count: activeUsers, error: activeError } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .is('is_suspended', false);
      
      if (activeError) throw activeError;
      
      // Get suspended users
      const { count: suspendedUsers, error: suspendedError } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_suspended', true);
      
      if (suspendedError) throw suspendedError;
      
      // Get new users in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: newUsers7Days, error: new7Error } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());
      
      if (new7Error) throw new7Error;
      
      // Get new users in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: newUsers30Days, error: new30Error } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      if (new30Error) throw new30Error;
      
      // Get users by role
      const { data: userRoles, error: rolesError } = await this.supabase
        .from('user_roles')
        .select('role_id, roles(name)');
      
      if (rolesError) throw rolesError;
      
      const byRole: Record<string, number> = {};
      
      if (userRoles) {
        userRoles.forEach(ur => {
          // Add proper type assertion for roles
          const roleName = ur.roles && typeof ur.roles === 'object' && 'name' in ur.roles ? String(ur.roles.name) : 'unknown';
          byRole[roleName] = (byRole[roleName] || 0) + 1;
        });
      }
      
      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        suspendedUsers: suspendedUsers || 0,
        newUsers: {
          last7Days: newUsers7Days || 0,
          last30Days: newUsers30Days || 0
        },
        byRole
      };
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        suspendedUsers: 0,
        newUsers: {
          last7Days: 0,
          last30Days: 0
        },
        byRole: {}
      };
    }
  }
  
  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      const stats = await adminFileService.getStorageStatistics();
      const topUsers = await adminFileService.getTopUsersByStorage(5);
      
      return {
        totalStorage: stats.totalStorage,
        usedStorage: stats.totalStorage, // For now, these are the same
        fileCount: stats.totalFiles,
        folderCount: stats.totalFolders,
        topUsers
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalStorage: 0,
        usedStorage: 0,
        fileCount: 0,
        folderCount: 0,
        topUsers: []
      };
    }
  }
  
  /**
   * Get activity statistics
   */
  async getActivityStats(timeRange: StatsTimeRange): Promise<ActivityStats> {
    try {
      const { startDate, endDate } = timeRange;
      
      // Get daily active users
      // This would typically be done with a database view or stored procedure
      // For now, we'll simulate it with a simple query
      
      // Get user signups by day
      const { data: signups, error: signupsError } = await this.supabase
        .from('users')
        .select('created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      
      if (signupsError) throw signupsError;
      
      // Group signups by day
      const signupsByDay: Record<string, number> = {};
      
      if (signups) {
        signups.forEach(user => {
          const date = new Date(user.created_at).toISOString().split('T')[0];
          signupsByDay[date] = (signupsByDay[date] || 0) + 1;
        });
      }
      
      // Get recent actions by type
      const { data: actions, error: actionsError } = await this.supabase
        .from('audit_logs')
        .select('action_type, timestamp')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);
      
      if (actionsError) throw actionsError;
      
      // Group actions by day and type
      const actionsByDayAndType: Record<string, Record<string, number>> = {};
      
      if (actions) {
        actions.forEach(action => {
          const date = new Date(action.timestamp).toISOString().split('T')[0];
          if (!actionsByDayAndType[date]) {
            actionsByDayAndType[date] = {};
          }
          actionsByDayAndType[date][action.action_type] = 
            (actionsByDayAndType[date][action.action_type] || 0) + 1;
        });
      }
      
      // Convert to arrays for the frontend
      const userSignups = Object.entries(signupsByDay).map(([date, count]) => ({
        date,
        count
      }));
      
      const recentActions = Object.entries(actionsByDayAndType).flatMap(([date, types]) => 
        Object.entries(types).map(([actionType, count]) => ({
          date,
          actionType,
          count
        }))
      );
      
      // For daily active users, we'll use a placeholder for now
      // In a real implementation, this would be based on login events or activity
      const dailyActiveUsers = userSignups.map(day => ({
        date: day.date,
        count: Math.floor(Math.random() * 10) + day.count // Placeholder
      }));
      
      return {
        dailyActiveUsers,
        userSignups,
        recentActions
      };
    } catch (error) {
      console.error('Failed to get activity stats:', error);
      return {
        dailyActiveUsers: [],
        userSignups: [],
        recentActions: []
      };
    }
  }
  
  /**
   * Get all dashboard statistics
   */
  async getDashboardStats(timeRange: StatsTimeRange): Promise<DashboardStats> {
    try {
      const users = await this.getUserStats();
      const storage = await this.getStorageStats();
      const activity = await this.getActivityStats(timeRange);
      
      return {
        users,
        storage,
        activity,
        timeRange
      };
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      return {
        users: {
          totalUsers: 0,
          activeUsers: 0,
          suspendedUsers: 0,
          newUsers: {
            last7Days: 0,
            last30Days: 0
          },
          byRole: {}
        },
        storage: {
          totalStorage: 0,
          usedStorage: 0,
          fileCount: 0,
          folderCount: 0,
          topUsers: []
        },
        activity: {
          dailyActiveUsers: [],
          userSignups: [],
          recentActions: []
        },
        timeRange
      };
    }
  }
}

// Export a singleton instance
export const analyticsService = new AnalyticsService();
