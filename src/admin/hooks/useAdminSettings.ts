/**
 * Hook for settings management in admin dashboard
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { OrganizationSettings, QuotaSettings } from '../types/settings'; // AdminSettings y FeatureFlag no se utilizan
import { settingsService } from '../services/settings-service';
import type { AdminUser } from '../types/auth';

export function useAdminSettings() {
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<AdminUser>(['currentAdminUser']);
  
  // Query to fetch all settings
  const settingsQuery = useQuery({
    queryKey: ['adminSettings'],
    queryFn: () => settingsService.getAllSettings()
  });
  
  // Mutation to update organization settings
  const updateOrgSettingsMutation = useMutation({
    mutationFn: (settings: Partial<OrganizationSettings>) => {
      if (!currentUser) {
        return Promise.reject(new Error('No current user'));
      }
      
      return settingsService.updateOrganizationSettings(
        currentUser.id,
        currentUser.email,
        settings
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
    }
  });
  
  // Mutation to update quota settings
  const updateQuotaSettingsMutation = useMutation({
    mutationFn: (settings: Partial<QuotaSettings>) => {
      if (!currentUser) {
        return Promise.reject(new Error('No current user'));
      }
      
      return settingsService.updateQuotaSettings(
        currentUser.id,
        currentUser.email,
        settings
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
    }
  });
  
  // Mutation to update feature flag
  const updateFeatureFlagMutation = useMutation({
    mutationFn: ({ flagId, enabled }: { flagId: string; enabled: boolean }) => {
      if (!currentUser) {
        return Promise.reject(new Error('No current user'));
      }
      
      return settingsService.updateFeatureFlag(
        currentUser.id,
        currentUser.email,
        flagId,
        enabled
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
    }
  });
  
  return {
    settings: settingsQuery.data,
    organization: settingsQuery.data?.organization,
    featureFlags: settingsQuery.data?.featureFlags || [],
    quotas: settingsQuery.data?.quotas,
    isLoading: settingsQuery.isLoading,
    isError: settingsQuery.isError,
    error: settingsQuery.error,
    
    updateOrganizationSettings: updateOrgSettingsMutation.mutateAsync,
    isOrgSettingsPending: updateOrgSettingsMutation.isPending,
    updateOrgError: updateOrgSettingsMutation.error,
    
    updateQuotaSettings: updateQuotaSettingsMutation.mutateAsync,
    isUpdatingQuotaSettingsPending: updateQuotaSettingsMutation.isPending,
    updateQuotaError: updateQuotaSettingsMutation.error,
    
    updateFeatureFlag: updateFeatureFlagMutation.mutateAsync,
    isUpdatingFeatureFlagPending: updateFeatureFlagMutation.isPending,
    updateFlagError: updateFeatureFlagMutation.error
  };
}
