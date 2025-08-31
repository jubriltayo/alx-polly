'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { signInWithEmail, signUpWithEmail, signOutUser, signInWithOAuth, getUserSession } from '@/lib/supabase/auth';
import { AuthProviders } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: typeof signInWithEmail;
  signUp: typeof signUpWithEmail;
  signOut: typeof signOutUser;
  signInWithOAuth: (provider: AuthProviders) => Promise<{ error: Error | null; data?: any }>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      const session = await getUserSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      setUser(session?.user || null);
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      } else if (event === 'SIGNED_IN') {
        router.push('/dashboard');
      }
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const contextValue: AuthContextType = {
    user,
    loading,
    signIn: signInWithEmail,
    signUp: signUpWithEmail,
    signOut: signOutUser,
    signInWithOAuth,
    error,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
