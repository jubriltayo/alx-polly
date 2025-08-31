'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function serverSignOut() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  return redirect('/login');
}
