import React, { useState } from 'react';
import { Save, Loader2, Upload } from 'lucide-react';
import { useAdminToast } from '../../context/AdminToastContext';
import { StateDisplay } from '../common/StateDisplay';

interface OrganizationSettingsProps {
  settings: {
    name: string;
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    contactEmail: string;
    supportEmail: string;
    maxStoragePerUser: number;
    maxFileSize: number;
    allowedFileTypes: string[];
    features: {
      sharing: boolean;
      versioning: boolean;
      comments: boolean;
      preview: boolean;
      encryption: boolean;
      publicLinks: boolean;
    };
  };
  isLoading: boolean;
  isError: boolean;
  isSaving: boolean;
  onSave: (settings: any) => Promise<void>;
}

/**
 * Component for managing organization settings
 */
export const OrganizationSettings: React.FC<OrganizationSettingsProps> = ({
  settings: initialSettings,
  isLoading,
  isError,
  isSaving,
  onSave
}) => {
  const { showToast } = useAdminToast();
  const [settings, setSettings] = useState(initialSettings);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      const [parent, child] = name.split('.');
      
      if (parent === 'features') {
        setSettings(prev => ({
          ...prev,
          features: {
            ...prev.features,
            [child]: checkbox.checked
          }
        }));
      }
    } 
    // Handle number inputs
    else if (type === 'number') {
      setSettings(prev => ({
        ...prev,
        [name]: parseFloat(value)
      }));
    } 
    // Handle text inputs
    else {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await onSave({
        ...settings,
        logoFile
      });
      showToast('success', 'Organization settings saved successfully');
    } catch (error) {
      showToast('error', `Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  return (
    <StateDisplay
      isLoading={isLoading}
      isError={isError}
      loadingMessage="Loading organization settings..."
      errorMessage="Failed to load organization settings. Please try again."
    >
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-medium text-slate-800">Organization Settings</h2>
          <p className="mt-1 text-sm text-slate-500">
            Configure your organization's branding, contact information, and feature settings.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Branding Section */}
            <div>
              <h3 className="text-md font-medium text-slate-800 mb-4">Branding</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Organization Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={settings.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                {/* Logo */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Logo
                  </label>
                  <div className="flex items-center">
                    <div className="mr-4 h-16 w-16 rounded-md border border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="max-h-full max-w-full" />
                      ) : settings.logo ? (
                        <img src={settings.logo} alt="Organization logo" className="max-h-full max-w-full" />
                      ) : (
                        <span className="text-slate-400 text-xs text-center">No logo</span>
                      )}
                    </div>
                    <label className="cursor-pointer px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      <Upload className="h-4 w-4 inline-block mr-1" />
                      Upload Logo
                      <input
                        type="file"
                        name="logo"
                        onChange={handleLogoChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Recommended size: 512x512px. Max file size: 2MB.
                  </p>
                </div>
                
                {/* Primary Color */}
                <div>
                  <label htmlFor="primaryColor" className="block text-sm font-medium text-slate-700 mb-1">
                    Primary Color
                  </label>
                  <div className="flex">
                    <input
                      type="color"
                      id="primaryColor"
                      name="primaryColor"
                      value={settings.primaryColor}
                      onChange={handleChange}
                      className="h-10 w-10 border-0 p-0"
                    />
                    <input
                      type="text"
                      value={settings.primaryColor}
                      onChange={handleChange}
                      name="primaryColor"
                      className="ml-2 flex-grow px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                {/* Secondary Color */}
                <div>
                  <label htmlFor="secondaryColor" className="block text-sm font-medium text-slate-700 mb-1">
                    Secondary Color
                  </label>
                  <div className="flex">
                    <input
                      type="color"
                      id="secondaryColor"
                      name="secondaryColor"
                      value={settings.secondaryColor}
                      onChange={handleChange}
                      className="h-10 w-10 border-0 p-0"
                    />
                    <input
                      type="text"
                      value={settings.secondaryColor}
                      onChange={handleChange}
                      name="secondaryColor"
                      className="ml-2 flex-grow px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact Information */}
            <div>
              <h3 className="text-md font-medium text-slate-800 mb-4">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Email */}
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-slate-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={settings.contactEmail}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    This email will be displayed to users for general inquiries.
                  </p>
                </div>
                
                {/* Support Email */}
                <div>
                  <label htmlFor="supportEmail" className="block text-sm font-medium text-slate-700 mb-1">
                    Support Email
                  </label>
                  <input
                    type="email"
                    id="supportEmail"
                    name="supportEmail"
                    value={settings.supportEmail}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    This email will be displayed to users for technical support.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Storage Limits */}
            <div>
              <h3 className="text-md font-medium text-slate-800 mb-4">Storage Limits</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Max Storage Per User */}
                <div>
                  <label htmlFor="maxStoragePerUser" className="block text-sm font-medium text-slate-700 mb-1">
                    Max Storage Per User (MB)
                  </label>
                  <input
                    type="number"
                    id="maxStoragePerUser"
                    name="maxStoragePerUser"
                    value={settings.maxStoragePerUser}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Max File Size */}
                <div>
                  <label htmlFor="maxFileSize" className="block text-sm font-medium text-slate-700 mb-1">
                    Max File Size (MB)
                  </label>
                  <input
                    type="number"
                    id="maxFileSize"
                    name="maxFileSize"
                    value={settings.maxFileSize}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Allowed File Types */}
                <div className="md:col-span-2">
                  <label htmlFor="allowedFileTypes" className="block text-sm font-medium text-slate-700 mb-1">
                    Allowed File Types
                  </label>
                  <input
                    type="text"
                    id="allowedFileTypes"
                    name="allowedFileTypes"
                    value={settings.allowedFileTypes.join(', ')}
                    onChange={(e) => {
                      const types = e.target.value.split(',').map(type => type.trim()).filter(Boolean);
                      setSettings(prev => ({
                        ...prev,
                        allowedFileTypes: types
                      }));
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Enter file extensions separated by commas (e.g., jpg, png, pdf, docx)
                  </p>
                </div>
              </div>
            </div>
            
            {/* Feature Flags */}
            <div>
              <h3 className="text-md font-medium text-slate-800 mb-4">Features</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sharing */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="features.sharing"
                    name="features.sharing"
                    checked={settings.features.sharing}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="features.sharing" className="ml-2 block text-sm text-slate-700">
                    Enable File Sharing
                  </label>
                </div>
                
                {/* Versioning */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="features.versioning"
                    name="features.versioning"
                    checked={settings.features.versioning}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="features.versioning" className="ml-2 block text-sm text-slate-700">
                    Enable File Versioning
                  </label>
                </div>
                
                {/* Comments */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="features.comments"
                    name="features.comments"
                    checked={settings.features.comments}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="features.comments" className="ml-2 block text-sm text-slate-700">
                    Enable File Comments
                  </label>
                </div>
                
                {/* Preview */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="features.preview"
                    name="features.preview"
                    checked={settings.features.preview}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="features.preview" className="ml-2 block text-sm text-slate-700">
                    Enable File Preview
                  </label>
                </div>
                
                {/* Encryption */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="features.encryption"
                    name="features.encryption"
                    checked={settings.features.encryption}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="features.encryption" className="ml-2 block text-sm text-slate-700">
                    Enable End-to-End Encryption
                  </label>
                </div>
                
                {/* Public Links */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="features.publicLinks"
                    name="features.publicLinks"
                    checked={settings.features.publicLinks}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="features.publicLinks" className="ml-2 block text-sm text-slate-700">
                    Enable Public Links
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </StateDisplay>
  );
};
