import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { FileExplorerPage, SharedFilesPage } from '../components/pages/FileExplorerPage';
import { TrashPage } from '../components/trash/TrashPage';
import { AdminApp } from '../admin/AdminApp';
import { useAuth } from '../hooks/useAuth';
import { Login } from '../components/auth/Login';
import { Register } from '../components/auth/Register';

export const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
      <Route path="/reset-password" element={<div>Reset Password Page</div>} />
      
      {/* Admin routes */}
      <Route path="/admin/*" element={<AdminApp />} />
      
      {/* Main app routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<FileExplorerPage />} />
        <Route path="folder/:folderId" element={<FileExplorerPage />} />
        <Route path="shared" element={<SharedFilesPage />} />
        <Route path="trash" element={<TrashPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
