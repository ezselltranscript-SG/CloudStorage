import React from 'react';
import { AdminRoutes } from './routes/AdminRoutes';
// Importamos desde el archivo índice para mejorar la resolución de módulos
import { AdminAuthProvider, AdminSettingsProvider } from './context';

export const AdminApp: React.FC = () => {
  return (
    <AdminAuthProvider>
      <AdminSettingsProvider>
        <AdminRoutes />
      </AdminSettingsProvider>
    </AdminAuthProvider>
  );
};
