import { supabase } from './client';

export async function signInWithProvider(provider: 'google' | 'github') {
  return supabase.auth.signInWithOAuth({ provider });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}
