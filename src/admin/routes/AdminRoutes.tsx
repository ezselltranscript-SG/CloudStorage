import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import { UsersPage } from '../pages/UsersPage';
import { RolesPage } from '../pages/RolesPage';
import { SettingsPage } from '../pages/SettingsPage';
import { AuditLogsPage } from '../pages/AuditLogsPage';
import { FilesPage } from '../pages/FilesPage';
// Importamos desde el archivo índice para mejorar la resolución de módulos
import { ProtectedRoute } from '../routes';

export const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute permission="view_dashboard">
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/users" 
        element={
          <ProtectedRoute permission="view_users">
            <UsersPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/roles" 
        element={
          <ProtectedRoute permission="manage_roles">
            <RolesPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute permission="manage_settings">
            <SettingsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/audit-logs" 
        element={
          <ProtectedRoute permission="view_audit_logs">
            <AuditLogsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/files" 
        element={
          <ProtectedRoute permission="manage_files">
            <FilesPage />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};
