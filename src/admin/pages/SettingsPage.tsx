import React, { useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { useAdminSettings } from '../hooks/useAdminSettings';
import { 
  Save, 
  Loader2, 
  AlertTriangle,
  Info,
  RefreshCw
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  // Get settings data
  const { 
    settings, 
    isLoading, 
    isError, 
    updateSettings,
    isUpdating,
    resetToDefaults,
    isResetting
  } = useAdminSettings() as any;
  
  // State for form values
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  // Initialize form values when settings load
  React.useEffect(() => {
    if (settings) {
      const initialValues: Record<string, any> = {};
      settings.forEach((setting: { key: string; value: any }) => {
        initialValues[setting.key] = setting.value;
      });
      setFormValues(initialValues);
      setHasChanges(false);
    }
  }, [settings]);
  
  // Group settings by category for better organization
  const settingsByCategory = React.useMemo(() => {
    if (!settings) return {};
    
    return settings.reduce((acc: Record<string, any[]>, setting: { category?: string }) => {
      const category = setting.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(setting);
      return acc;
    }, {} as Record<string, typeof settings>);
  }, [settings]);
  
  // Handle input change
  const handleInputChange = (key: string, value: any, type: string) => {
    let parsedValue = value;
    
    // Parse value based on type
    if (type === 'number') {
      parsedValue = value === '' ? '' : Number(value);
    } else if (type === 'boolean') {
      parsedValue = value === 'true';
    }
    
    setFormValues(prev => ({
      ...prev,
      [key]: parsedValue
    }));
    
    setHasChanges(true);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out unchanged values
    const changedSettings = Object.entries(formValues)
      .filter(([key, value]) => {
        const originalSetting = settings?.find((s: { key: string; value: any }) => s.key === key);
        return originalSetting && originalSetting.value !== value;
      })
      .map(([key, value]) => ({ key, value }));
    
    if (changedSettings.length > 0) {
      await updateSettings(changedSettings);
      setHasChanges(false);
    }
  };
  
  // Handle reset to defaults
  const handleResetToDefaults = async () => {
    if (window.confirm('Are you sure you want to reset all settings to their default values? This action cannot be undone.')) {
      await resetToDefaults();
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <AdminLayout title="System Settings" requirePermission="manage_settings">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading settings...</span>
        </div>
      </AdminLayout>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <AdminLayout title="System Settings" requirePermission="manage_settings">
        <div className="flex items-center justify-center h-64 text-red-500">
          <AlertTriangle className="h-8 w-8 mr-2" />
          <span>Error loading settings. Please try again.</span>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title="System Settings" requirePermission="manage_settings">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">System Settings</h1>
        
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button
            onClick={handleResetToDefaults}
            disabled={isResetting}
            className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResetting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </>
            )}
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!hasChanges || isUpdating}
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Settings form */}
      <form onSubmit={handleSubmit}>
        {Object.entries(settingsByCategory).map(([category, categorySettings]) => (
          <div key={category} className="bg-white rounded-lg shadow mb-6 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-medium text-slate-800">{category}</h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {(categorySettings as any[]).map((setting: { key: string; name: string; description?: string; type: string; options?: any[]; hint?: string }) => (
                  <div key={setting.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <div>
                      <label htmlFor={setting.key} className="block text-sm font-medium text-slate-700">
                        {setting.name}
                      </label>
                      {setting.description && (
                        <p className="mt-1 text-sm text-slate-500">{setting.description}</p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      {setting.type === 'string' && (
                        <input
                          type="text"
                          id={setting.key}
                          value={formValues[setting.key] || ''}
                          onChange={(e) => handleInputChange(setting.key, e.target.value, setting.type)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      )}
                      
                      {setting.type === 'number' && (
                        <input
                          type="number"
                          id={setting.key}
                          value={formValues[setting.key] || ''}
                          onChange={(e) => handleInputChange(setting.key, e.target.value, setting.type)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      )}
                      
                      {setting.type === 'boolean' && (
                        <select
                          id={setting.key}
                          value={formValues[setting.key]?.toString() || 'false'}
                          onChange={(e) => handleInputChange(setting.key, e.target.value, setting.type)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="true">Enabled</option>
                          <option value="false">Disabled</option>
                        </select>
                      )}
                      
                      {setting.type === 'select' && setting.options && (
                        <select
                          id={setting.key}
                          value={formValues[setting.key] || ''}
                          onChange={(e) => handleInputChange(setting.key, e.target.value, 'string')}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          {setting.options.map((option: { value: string; label: string }) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      {setting.type === 'textarea' && (
                        <textarea
                          id={setting.key}
                          value={formValues[setting.key] || ''}
                          onChange={(e) => handleInputChange(setting.key, e.target.value, 'string')}
                          rows={4}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      )}
                      
                      {setting.hint && (
                        <div className="mt-1 flex items-start">
                          <div className="flex-shrink-0">
                            <Info className="h-4 w-4 text-slate-400" />
                          </div>
                          <p className="ml-1 text-xs text-slate-500">{setting.hint}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        
        {/* Submit button for mobile */}
        <div className="md:hidden">
          <button
            type="submit"
            disabled={!hasChanges || isUpdating}
            className="w-full inline-flex justify-center items-center px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};
