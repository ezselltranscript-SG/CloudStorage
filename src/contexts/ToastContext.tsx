import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { Toast } from '../components/ui/Toast';
import type { ToastProps } from '../components/ui/Toast';
import { v4 as uuidv4 } from 'uuid';

interface ToastContextType {
  showToast: (props: Omit<ToastProps, 'id' | 'onClose'>) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = (props: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = uuidv4();
    setToasts((prevToasts) => [...prevToasts, { ...props, id, onClose: removeToast }]);
  };

  const showSuccess = (title: string, message?: string) => {
    showToast({ title, message, type: 'success' });
  };

  const showError = (title: string, message?: string) => {
    showToast({ title, message, type: 'error' });
  };

  const showInfo = (title: string, message?: string) => {
    showToast({ title, message, type: 'info' });
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
