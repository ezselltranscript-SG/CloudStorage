import React, { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';
// Definimos el tipo ToastType directamente aquí para evitar problemas de importación
type ToastType = 'success' | 'error' | 'warning' | 'info';
import { AdminToast } from '../components/common/AdminToast';

// Define a type for toast items
interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// Define the context type
interface AdminToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  hideToast: (id: string) => void;
}

// Create the context with default values
const AdminToastContext = createContext<AdminToastContextType | undefined>(undefined);

interface AdminToastProviderProps {
  children: ReactNode;
}

export const AdminToastProvider: React.FC<AdminToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  // Function to show a new toast
  const showToast = (type: ToastType, message: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setToasts(prevToasts => [
      ...prevToasts,
      { id, type, message, duration }
    ]);
    
    return id;
  };
  
  // Function to hide a toast
  const hideToast = (id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };
  
  return (
    <AdminToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {/* Render all active toasts */}
      {toasts.map(toast => (
        <AdminToast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={() => hideToast(toast.id)}
        />
      ))}
    </AdminToastContext.Provider>
  );
};

// Custom hook to use the toast context
export const useAdminToast = (): AdminToastContextType => {
  const context = useContext(AdminToastContext);
  
  if (context === undefined) {
    throw new Error('useAdminToast must be used within an AdminToastProvider');
  }
  
  return context;
};
