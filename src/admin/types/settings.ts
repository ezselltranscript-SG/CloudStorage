/**
 * Admin settings and configuration types
 */

export interface OrganizationSettings {
  id: string;
  name: string;
  logoUrl?: string;
  supportEmail?: string;
  defaultUserRole: string; // Role ID for new users
  allowedEmailDomains?: string[]; // Restrict signups to these domains
  maxStoragePerUser?: number; // in bytes, null for unlimited
  updatedAt: string;
  updatedBy: string;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface QuotaSettings {
  maxFileSizeUpload: number; // in bytes
  maxConcurrentUploads: number;
  maxFileSharesPerUser: number;
  maxFoldersPerUser: number;
}

export interface AdminSettings {
  organization: OrganizationSettings;
  featureFlags: FeatureFlag[];
  quotas: QuotaSettings;
}
