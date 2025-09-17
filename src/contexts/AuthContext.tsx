import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase/supabase-client';
import { useToast } from './ToastContext';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<boolean>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    // Inicializar sin intentar obtener sesión existente
    // Evitar getSession() que puede triggear refresh automático
    setSession(null);
    setUser(null);
    setError(null);
    setLoading(false);

    // NO configurar onAuthStateChange listener
    // Este listener automáticamente intenta refrescar tokens expirados
    // causando los 503 errors infinitos
  }, []);

  const signUp = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // Timeout específico para signup (20 segundos)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Signup timeout')), 20000)
      );
      
      const signupPromise = supabase.auth.signUp({
        email,
        password,
      });

      const { data, error } = await Promise.race([signupPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Sign up error:', error);
        showError(error.message);
        return false;
      }

      if (data.user) {
        // Manualmente actualizar estado si hay sesión
        if (data.session) {
          setSession(data.session);
          setUser(data.user);
        }
        showSuccess('Account created successfully! Please check your email to verify your account.');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Sign up error:', error);
      if (error instanceof Error && error.message.includes('timeout')) {
        showError('Signup timeout - please try again');
      } else {
        showError('An unexpected error occurred');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // Timeout específico para login (20 segundos)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout')), 20000)
      );
      
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Sign in error:', error);
        showError(error.message);
        return false;
      }

      if (data.user && data.session) {
        // Manualmente actualizar estado sin listener automático
        setSession(data.session);
        setUser(data.user);
        showSuccess('Successfully signed in!');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Sign in error:', error);
      if (error instanceof Error && error.message.includes('timeout')) {
        showError('Login timeout - please try again');
      } else {
        showError('An unexpected error occurred');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<boolean> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Sign out error:', error);
        showError(error.message);
        return false;
      }

      // Manualmente limpiar estado
      setSession(null);
      setUser(null);
      setError(null);
      showSuccess('Successfully signed out!');
      return true;
    } catch (error) {
      console.error('Sign out error:', error);
      showError('An unexpected error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
