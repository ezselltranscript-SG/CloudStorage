export interface AdminSettings {
  id: string;
  name: string;
  value: any;
  category: string;
  description?: string;
  isEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Añadiendo métodos para resolver errores de tipo
  forEach: (callback: (setting: any) => void) => void;
  reduce: <T>(callback: (acc: T, setting: any) => T, initialValue: T) => T;
  find: (predicate: (s: any) => boolean) => any;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrganizationSettings {
  id: string;
  name: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  contactEmail?: string;
  supportUrl?: string;
  termsUrl?: string;
  privacyUrl?: string;
}

export interface QuotaSettings {
  id: string;
  storageLimit: number;
  userLimit: number;
  fileLimit: number;
}

export interface AdminSettingsResult {
  settings: AdminSettings | null | undefined;
  organization: OrganizationSettings | undefined;
  featureFlags: FeatureFlag[];
  quotas: QuotaSettings | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  updateSettings: (settings: Partial<AdminSettings>) => Promise<{ success: boolean; error: string | null }>;
  updateOrganization: (data: Partial<OrganizationSettings>) => Promise<{ success: boolean; error: string | null }>;
  updateQuotas: (data: Partial<QuotaSettings>) => Promise<{ success: boolean; error: string | null }>;
  toggleFeatureFlag: (flagId: string) => Promise<{ success: boolean; error: string | null }>;
  isUpdating: boolean;
  resetToDefaults: () => Promise<{ success: boolean; error: string | null }>;
  isResetting: boolean;
  refetch: () => void;
}

export function useAdminSettings(): AdminSettingsResult;
