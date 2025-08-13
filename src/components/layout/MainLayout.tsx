import React, { useState } from 'react';
import { Sidebar } from './Sidebar.js';
import { FileExplorer } from '../file-explorer/FileExplorer.js';
import { UserProfile } from '../auth/UserProfile';
import { Search, Bell, Menu, X, HelpCircle, Settings } from 'lucide-react';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = () => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const handleFolderClick = (folderId: string | null) => {
    setCurrentFolderId(folderId);
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar with toggle functionality */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden`}>
        <Sidebar 
          currentFolderId={currentFolderId}
          onFolderClick={handleFolderClick}
        />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Modern header with improved styling */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16 flex items-center px-4 shadow-sm">
          {/* Left section: Toggle sidebar and logo */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md hover:bg-slate-100 text-slate-600"
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            
            <div className="flex items-center">
              <span className="font-semibold text-xl text-blue-600">Cloud</span>
              <span className="font-semibold text-xl text-slate-800">Storage</span>
            </div>
          </div>
          
          {/* Center section: Search */}
          <div className="flex-1 max-w-2xl mx-auto px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search files and folders..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
              />
            </div>
          </div>
          
          {/* Right section: Actions and profile */}
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-slate-100" aria-label="Help">
              <HelpCircle className="h-5 w-5 text-slate-500" />
            </button>
            <button className="p-2 rounded-full hover:bg-slate-100" aria-label="Settings">
              <Settings className="h-5 w-5 text-slate-500" />
            </button>
            <button className="p-2 rounded-full hover:bg-slate-100" aria-label="Notifications">
              <Bell className="h-5 w-5 text-slate-500" />
            </button>
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-200">
              <UserProfile />
            </div>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <FileExplorer 
            currentFolderId={currentFolderId}
            onFolderClick={handleFolderClick}
          />
        </main>
      </div>
    </div>
  );
};
