/**
 * Settings service for admin dashboard
 */

import { AdminServiceBase } from './admin-service-base';
import type { AdminSettings, FeatureFlag, OrganizationSettings, QuotaSettings } from '../types/settings';
import type { AuditLogAction } from '../types/audit-log';

export class SettingsService extends AdminServiceBase {
  /**
   * Get organization settings
   */
  async getOrganizationSettings(): Promise<OrganizationSettings | null> {
    try {
      const { data, error } = await this.supabase
        .from('organization_settings')
        .select('*')
        .single();
      
      if (error) {
        console.error('Failed to get organization settings:', error);
        return null;
      }
      
      return {
        id: data.id,
        name: data.name,
        logoUrl: data.logo_url,
        supportEmail: data.support_email,
        defaultUserRole: data.default_user_role,
        allowedEmailDomains: data.allowed_email_domains,
        maxStoragePerUser: data.max_storage_per_user,
        updatedAt: data.updated_at,
        updatedBy: data.updated_by
      };
    } catch (error) {
      console.error('Failed to get organization settings:', error);
      return null;
    }
  }
  
  /**
   * Update organization settings
   */
  async updateOrganizationSettings(
    currentUserId: string,
    currentUserEmail: string,
    settings: Partial<OrganizationSettings>
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get original settings for audit
      const originalSettings = await this.getOrganizationSettings();
      
      if (!originalSettings) {
        return { success: false, error: 'Organization settings not found' };
      }
      
      // Prepare updates
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
        updated_by: currentUserId
      };
      
      if (settings.name !== undefined) updates.name = settings.name;
      if (settings.logoUrl !== undefined) updates.logo_url = settings.logoUrl;
      if (settings.supportEmail !== undefined) updates.support_email = settings.supportEmail;
      if (settings.defaultUserRole !== undefined) updates.default_user_role = settings.defaultUserRole;
      if (settings.allowedEmailDomains !== undefined) updates.allowed_email_domains = settings.allowedEmailDomains;
      if (settings.maxStoragePerUser !== undefined) updates.max_storage_per_user = settings.maxStoragePerUser;
      
      // Update settings
      const { error } = await this.supabase
        .from('organization_settings')
        .update(updates)
        .eq('id', originalSettings.id);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Create audit log
      await this.createAuditLog(
        currentUserId,
        currentUserEmail,
        'settings_updated' as AuditLogAction,
        'settings' as const,
        originalSettings.id,
        'Organization Settings',
        {
          changes: {
            name: settings.name !== undefined ? { from: originalSettings.name, to: settings.name } : undefined,
            logoUrl: settings.logoUrl !== undefined ? { from: originalSettings.logoUrl, to: settings.logoUrl } : undefined,
            supportEmail: settings.supportEmail !== undefined ? { from: originalSettings.supportEmail, to: settings.supportEmail } : undefined,
            defaultUserRole: settings.defaultUserRole !== undefined ? { from: originalSettings.defaultUserRole, to: settings.defaultUserRole } : undefined,
            allowedEmailDomains: settings.allowedEmailDomains !== undefined ? { from: originalSettings.allowedEmailDomains, to: settings.allowedEmailDomains } : undefined,
            maxStoragePerUser: settings.maxStoragePerUser !== undefined ? { from: originalSettings.maxStoragePerUser, to: settings.maxStoragePerUser } : undefined
          }
        }
      );
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Failed to update organization settings:', error);
      return { success: false, error: error.message || 'An unknown error occurred' };
    }
  }
  
  /**
   * Get feature flags
   */
  async getFeatureFlags(): Promise<FeatureFlag[]> {
    try {
      const { data, error } = await this.supabase
        .from('feature_flags')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(flag => ({
        id: flag.id,
        name: flag.name,
        description: flag.description,
        enabled: flag.enabled,
        updatedAt: flag.updated_at,
        updatedBy: flag.updated_by
      }));
    } catch (error) {
      console.error('Failed to get feature flags:', error);
      return [];
    }
  }
  
  /**
   * Update feature flag
   */
  async updateFeatureFlag(
    currentUserId: string,
    currentUserEmail: string,
    flagId: string,
    enabled: boolean
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get original flag for audit
      const { data: originalFlag, error: flagError } = await this.supabase
        .from('feature_flags')
        .select('*')
        .eq('id', flagId)
        .single();
      
      if (flagError || !originalFlag) {
        return { success: false, error: flagError?.message || 'Feature flag not found' };
      }
      
      // Update flag
      const { error } = await this.supabase
        .from('feature_flags')
        .update({
          enabled,
          updated_at: new Date().toISOString(),
          updated_by: currentUserId
        })
        .eq('id', flagId);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Create audit log
      await this.createAuditLog(
        currentUserId,
        currentUserEmail,
        'settings_updated' as AuditLogAction,
        'settings' as const,
        flagId,
        `Feature Flag: ${originalFlag.name}`,
        {
          changes: {
            enabled: { from: originalFlag.enabled, to: enabled }
          }
        }
      );
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Failed to update feature flag:', error);
      return { success: false, error: error.message || 'An unknown error occurred' };
    }
  }
  
  /**
   * Get quota settings
   */
  async getQuotaSettings(): Promise<QuotaSettings | null> {
    try {
      const { data, error } = await this.supabase
        .from('quota_settings')
        .select('*')
        .single();
      
      if (error) {
        console.error('Failed to get quota settings:', error);
        return null;
      }
      
      return {
        maxFileSizeUpload: data.max_file_size_upload,
        maxConcurrentUploads: data.max_concurrent_uploads,
        maxFileSharesPerUser: data.max_file_shares_per_user,
        maxFoldersPerUser: data.max_folders_per_user
      };
    } catch (error) {
      console.error('Failed to get quota settings:', error);
      return null;
    }
  }
  
  /**
   * Update quota settings
   */
  async updateQuotaSettings(
    currentUserId: string,
    currentUserEmail: string,
    settings: Partial<QuotaSettings>
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get original settings for audit
      const originalSettings = await this.getQuotaSettings();
      
      if (!originalSettings) {
        return { success: false, error: 'Quota settings not found' };
      }
      
      // Prepare updates
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
        updated_by: currentUserId
      };
      
      if (settings.maxFileSizeUpload !== undefined) updates.max_file_size_upload = settings.maxFileSizeUpload;
      if (settings.maxConcurrentUploads !== undefined) updates.max_concurrent_uploads = settings.maxConcurrentUploads;
      if (settings.maxFileSharesPerUser !== undefined) updates.max_file_shares_per_user = settings.maxFileSharesPerUser;
      if (settings.maxFoldersPerUser !== undefined) updates.max_folders_per_user = settings.maxFoldersPerUser;
      
      // Update settings
      const { error } = await this.supabase
        .from('quota_settings')
        .update(updates)
        .eq('id', 1); // Assuming there's only one quota settings record
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Create audit log
      await this.createAuditLog(
        currentUserId,
        currentUserEmail,
        'settings_updated' as AuditLogAction,
        'settings' as const,
        '1',
        'Quota Settings',
        {
          changes: {
            maxFileSizeUpload: settings.maxFileSizeUpload !== undefined ? 
              { from: originalSettings.maxFileSizeUpload, to: settings.maxFileSizeUpload } : undefined,
            maxConcurrentUploads: settings.maxConcurrentUploads !== undefined ? 
              { from: originalSettings.maxConcurrentUploads, to: settings.maxConcurrentUploads } : undefined,
            maxFileSharesPerUser: settings.maxFileSharesPerUser !== undefined ? 
              { from: originalSettings.maxFileSharesPerUser, to: settings.maxFileSharesPerUser } : undefined,
            maxFoldersPerUser: settings.maxFoldersPerUser !== undefined ? 
              { from: originalSettings.maxFoldersPerUser, to: settings.maxFoldersPerUser } : undefined
          }
        }
      );
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Failed to update quota settings:', error);
      return { success: false, error: error.message || 'An unknown error occurred' };
    }
  }
  
  /**
   * Get all settings
   */
  async getAllSettings(): Promise<AdminSettings | null> {
    try {
      const organization = await this.getOrganizationSettings();
      const featureFlags = await this.getFeatureFlags();
      const quotas = await this.getQuotaSettings();
      
      if (!organization || !quotas) {
        return null;
      }
      
      return {
        organization,
        featureFlags,
        quotas
      };
    } catch (error) {
      console.error('Failed to get all settings:', error);
      return null;
    }
  }
}

// Export a singleton instance
export const settingsService = new SettingsService();
