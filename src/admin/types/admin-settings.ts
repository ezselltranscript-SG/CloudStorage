export interface OrganizationSettings {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  contactEmail: string;
  supportUrl: string | null;
  termsUrl: string | null;
  privacyUrl: string | null;
}

export interface QuotaSettings {
  defaultUserQuotaMB: number;
  maxFileUploadSizeMB: number;
  allowedFileTypes: string[];
  disallowedFileTypes: string[];
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'core' | 'experimental' | 'beta';
}

export interface AdminSettings {
  organization: OrganizationSettings;
  quotas: QuotaSettings;
  featureFlags: FeatureFlag[];
  updatedAt: string;
}

export interface AdminSettingsContextType {
  settings: AdminSettings | null | undefined;
  organization: OrganizationSettings | undefined;
  featureFlags: FeatureFlag[];
  quotas: QuotaSettings | undefined;
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
  updateOrganization: (data: Partial<OrganizationSettings>) => Promise<void>;
  updateQuotas: (data: Partial<QuotaSettings>) => Promise<void>;
  updateFeatureFlag: (id: string, enabled: boolean) => Promise<void>;
  isUpdatingFlag: boolean;
  updateFlagError: Error | null;
}
