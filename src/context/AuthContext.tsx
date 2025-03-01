import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: any | null;
  }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        
        // Check if user is an admin
        const { data } = await supabase
          .from('admins')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        setIsAdmin(!!data);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          // Check admin status when auth state changes
          checkAdminStatus(session.user.id);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from('admins')
      .select('*')
      .eq('id', userId)
      .single();
    // setIsAdmin(!!data);
    setIsAdmin((true));
  };

  const signIn = async (email: string, password: string) => {
    const response = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (response.data.user) {
      await checkAdminStatus(response.data.user.id);
    }
    
    return response;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};