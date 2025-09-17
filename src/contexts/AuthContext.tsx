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
    const initAuth = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth initialization timeout')), 15000)
        );
        
        const sessionPromise = supabase.auth.getSession();
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        setSession(session);
        setUser(session?.user ?? null);
        setError(null); 
      } catch (error) {
        console.log('Auth initialization failed:', error);
        if (error instanceof Error && error.message.includes('timeout')) {
          setError('Authentication service unavailable');
        }
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    let subscription: any;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setError(null); 
        setLoading(false);
      });
      subscription = data;
    } catch (error) {
      console.log('Auth listener failed:', error);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
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

      if (data.user) {
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
        setError(error.message);
        showError(error.message);
        return false;
      } else {
        showSuccess('Successfully logged out');
        return true;
      }
    } catch (error: any) {
      setError(error.message);
      showError(error.message);
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
