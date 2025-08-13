import React, { useState } from 'react';
import { Menu, Bell, Search, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import type { AdminUser } from '../../types/auth';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface AdminTopbarProps {
  title: string;
  onMenuClick: () => void;
  user: AdminUser;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  title,
  onMenuClick,
  user
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { logout } = useAdminAuth();
  
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
    if (notificationsOpen) setNotificationsOpen(false);
  };
  
  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (userMenuOpen) setUserMenuOpen(false);
  };
  
  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-6">
      {/* Left side */}
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="p-2 rounded-md text-slate-500 hover:bg-slate-100 focus:outline-none"
        >
          <Menu size={20} />
        </button>
        
        <h1 className="ml-4 text-xl font-semibold text-slate-800">{title}</h1>
      </div>
      
      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="hidden md:flex items-center bg-slate-100 rounded-md px-3 py-1.5">
          <Search size={18} className="text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none focus:outline-none text-sm ml-2 w-40 lg:w-64"
          />
        </div>
        
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 focus:outline-none relative"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          {/* Notifications dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-10 border border-slate-200">
              <div className="px-4 py-2 border-b border-slate-200">
                <h3 className="text-sm font-medium">Notifications</h3>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {/* Sample notifications */}
                <div className="px-4 py-3 hover:bg-slate-50 border-b border-slate-100">
                  <p className="text-sm font-medium">New user registered</p>
                  <p className="text-xs text-slate-500">5 minutes ago</p>
                </div>
                <div className="px-4 py-3 hover:bg-slate-50 border-b border-slate-100">
                  <p className="text-sm font-medium">Storage limit reached</p>
                  <p className="text-xs text-slate-500">1 hour ago</p>
                </div>
                <div className="px-4 py-3 hover:bg-slate-50">
                  <p className="text-sm font-medium">System update completed</p>
                  <p className="text-xs text-slate-500">Yesterday</p>
                </div>
              </div>
              
              <div className="px-4 py-2 border-t border-slate-200">
                <button className="text-sm text-primary hover:underline w-full text-center">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* User menu */}
        <div className="relative">
          <button
            onClick={toggleUserMenu}
            className="flex items-center space-x-2 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
              {user.firstName ? user.firstName.charAt(0) : user.email.charAt(0).toUpperCase()}
            </div>
            <span className="hidden md:block text-sm font-medium">
              {user.firstName || user.email.split('@')[0]}
            </span>
            <ChevronDown size={16} className="hidden md:block" />
          </button>
          
          {/* User dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-slate-200">
              <div className="px-4 py-2 border-b border-slate-200">
                <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                <User size={16} className="mr-2" />
                Profile
              </button>
              
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                <Settings size={16} className="mr-2" />
                Account Settings
              </button>
              
              <div className="border-t border-slate-200 mt-1"></div>
              
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-slate-100"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
