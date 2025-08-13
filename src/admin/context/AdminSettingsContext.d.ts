import React from 'react';
import { ReactNode } from 'react';

export interface AdminSettings {
  siteTitle: string;
  logoUrl: string;
  primaryColor: string;
  maxUploadSize: number; // in MB
  defaultQuota: number; // in MB
  allowPublicSharing: boolean;
  requireEmailVerification: boolean;
  maintenanceMode: boolean;
  analyticsEnabled: boolean;
  auditLogRetention: number; // in days
}

export interface AdminSettingsContextType {
  settings: AdminSettings;
  updateSettings: (newSettings: Partial<AdminSettings>) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  isSaving: boolean;
}

export interface AdminSettingsProviderProps {
  children: ReactNode;
}

export const AdminSettingsProvider: React.FC<AdminSettingsProviderProps>;
export const useAdminSettingsContext: () => AdminSettingsContextType;
