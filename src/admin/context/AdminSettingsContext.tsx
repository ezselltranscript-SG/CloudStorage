import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAdminSettings } from '../hooks/useAdminSettings';

// Define the settings interface
interface AdminSettings {
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

// Define the context type
interface AdminSettingsContextType {
  settings: AdminSettings;
  updateSettings: (newSettings: Partial<AdminSettings>) => Promise<void>;
  isLoading: boolean;
  error: Error | null; // Cambiado de string | null a Error | null para coincidir con el tipo devuelto por useAdminSettings
  isSaving: boolean;
}

// Create the context with default values
const AdminSettingsContext = createContext<AdminSettingsContextType | undefined>(undefined);

// Default settings
const defaultSettings: AdminSettings = {
  siteTitle: 'Dropbox Clone',
  logoUrl: '/logo.png',
  primaryColor: '#0061fe',
  maxUploadSize: 100,
  defaultQuota: 1024,
  allowPublicSharing: true,
  requireEmailVerification: true,
  maintenanceMode: false,
  analyticsEnabled: true,
  auditLogRetention: 90
};

interface AdminSettingsProviderProps {
  children: ReactNode;
}

export const AdminSettingsProvider: React.FC<AdminSettingsProviderProps> = ({ children }) => {
  const { 
    settings: fetchedSettings, 
    updateOrganizationSettings,
    isLoading, 
    error,
    isOrgSettingsPending
  } = useAdminSettings();
  
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  
  // Update settings when they are fetched
  useEffect(() => {
    if (fetchedSettings) {
      setSettings({
        ...defaultSettings,
        ...fetchedSettings
      });
    }
  }, [fetchedSettings]);
  
  // Function to update settings
  const updateSettings = async (newSettings: Partial<AdminSettings>) => {
    try {
      await updateOrganizationSettings(newSettings);
      setSettings(prev => ({
        ...prev,
        ...newSettings
      }));
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };
  
  const value = {
    settings,
    updateSettings,
    isLoading,
    error,
    isSaving: isOrgSettingsPending
  };
  
  return (
    <AdminSettingsContext.Provider value={value}>
      {children}
    </AdminSettingsContext.Provider>
  );
};

// Custom hook to use the settings context
export const useAdminSettingsContext = (): AdminSettingsContextType => {
  const context = useContext(AdminSettingsContext);
  
  if (context === undefined) {
    throw new Error('useAdminSettingsContext must be used within an AdminSettingsProvider');
  }
  
  return context;
};
