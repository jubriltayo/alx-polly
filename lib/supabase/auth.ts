import { createClient } from './client';
import { createSupabaseServerClient } from './server';
import { redirect } from 'next/navigation';
import { type AuthProviders } from '@/types/auth';

// Get a client-side Supabase instance for use in client components
const supabase = createClient();

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ 
    email, 
    password, 
    options: {
      emailRedirectTo: `${window.location.origin}/api/auth/callback`,
    }
  });
}

export async function signInWithOAuth(provider: AuthProviders) {
  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback`,
    },
  });
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    return { success: false, error };
  }
  return { success: true };
}

export async function getUserSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
