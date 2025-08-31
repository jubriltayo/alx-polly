// lib/actions/auth.ts
'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function serverSignOut() {
  try {
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Sign out error:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in serverSignOut:', error)
    // You might want to handle this error differently
  }
  
  // Redirect after sign out
  redirect('/login')
}