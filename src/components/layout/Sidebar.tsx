import React from 'react';
import { FolderPlus, Home, Clock, Trash2, Settings, Cloud, Star, Share2 } from 'lucide-react';
import { FolderTree } from '../navigation/FolderTree';
import { cn } from '../../lib/utils/cn';
import { useNavigate, useLocation } from 'react-router-dom';

export interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  className
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine current section based on URL
  const isTrashActive = location.pathname === '/trash';
  const isSharedActive = location.pathname === '/shared';
  const isHomeActive = location.pathname === '/' || location.pathname.startsWith('/folder/');
  return (
    <aside className={`h-screen w-64 bg-white border-r border-slate-200 flex flex-col ${className || ''}`}>
      {/* Logo and brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
          <Cloud className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-lg font-semibold text-slate-900">CloudDrive</span>
          <div className="text-xs text-slate-500 mt-0.5">Personal Storage</div>
        </div>
      </div>
      
      {/* Main navigation */}
      <nav className="flex-1 flex flex-col px-3 py-4 overflow-y-auto">
        {/* Storage stats */}
        <div className="mb-6 px-3">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">Storage</span>
              <span className="text-xs font-medium text-blue-600">75% used</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <div className="mt-2 text-xs text-slate-500">7.5 GB of 10 GB used</div>
          </div>
        </div>

        {/* Main sections */}
        <div className="space-y-1 mb-6">
          <button
            className={cn(
              "flex items-center w-full gap-3 px-3 py-2.5 rounded-md text-sm transition",
              isHomeActive 
                ? "bg-blue-50 text-blue-600 font-medium" 
                : "text-slate-700 hover:bg-slate-50"
            )}
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4 flex-shrink-0" />
            <span>My Files</span>
          </button>
          
          <button
            className="flex items-center w-full gap-3 px-3 py-2.5 rounded-md text-sm text-slate-700 hover:bg-slate-50 transition"
            onClick={() => {}}
          >
            <Star className="h-4 w-4 flex-shrink-0" />
            <span>Favorites</span>
          </button>
          
          <button
            className={cn(
              "flex items-center w-full gap-3 px-3 py-2.5 rounded-md text-sm transition",
              isSharedActive 
                ? "bg-blue-50 text-blue-600 font-medium" 
                : "text-slate-700 hover:bg-slate-50"
            )}
            onClick={() => navigate('/shared')}
          >
            <Share2 className="h-4 w-4 flex-shrink-0" />
            <span>Shared</span>
          </button>
          
          <button
            className="flex items-center w-full gap-3 px-3 py-2.5 rounded-md text-sm text-slate-700 hover:bg-slate-50 transition"
            onClick={() => {}}
          >
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>Recent</span>
          </button>
          
          <button
            className={cn(
              "flex items-center w-full gap-3 px-3 py-2.5 rounded-md text-sm transition",
              isTrashActive 
                ? "bg-blue-50 text-blue-600 font-medium" 
                : "text-slate-700 hover:bg-slate-50"
            )}
            onClick={() => navigate('/trash')}
          >
            <Trash2 className="h-4 w-4 flex-shrink-0" />
            <span>Trash</span>
          </button>
        </div>
        
        {/* Folders section with tree view */}
        <div className="mb-4">
          <h2 className="text-xs font-medium text-slate-500 px-3 mb-3 flex items-center justify-between">
            <span>Folders</span>
            <button className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
          </h2>
          <div className="px-1">
            <FolderTree 
              onFolderSelect={(folderId) => {
                if (folderId) {
                  navigate(`/folder/${folderId}`);
                } else {
                  navigate('/');
                }
              }}
              selectedFolderId={location.pathname.startsWith('/folder/') 
                ? location.pathname.split('/folder/')[1] 
                : null
              }
            />
          </div>
        </div>
      </nav>
      
      {/* User account section will be directly below */}
      
      {/* User account footer */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
              JS
            </div>
            <div>
              <div className="text-sm font-medium text-slate-800">User</div>
              <div className="text-xs text-slate-500">Free Plan</div>
            </div>
          </div>
          <button className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-700">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
