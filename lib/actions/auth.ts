// lib/actions/auth.ts
'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Purpose:
 *   Signs out the current user from Supabase authentication and redirects to the login page.
 *
 * Why:
 *   Centralizes server-side sign-out logic to ensure session cookies are properly cleared and the user is securely redirected.
 *   This avoids client-side inconsistencies and leverages Next.js Server Actions for secure session management.
 *
 * Assumptions:
 *   - Assumes this function is only called in a server-side context (e.g., from a Server Action or Server Component).
 *   - Assumes the Supabase client is correctly initialized with the current request's cookies for session awareness.
 *
 * Edge cases:
 *   - If sign-out fails (e.g., network error, Supabase error), the error is logged and rethrown, but the user is still redirected to the login page.
 *   - If cookies are missing or invalid, Supabase may return an error, which is caught and logged.
 *
 * Used by:
 *   - Invoked by authentication-related Server Actions or form submissions to log out users and enforce a clean authentication state.
 *   - Typically called from UI components (e.g., logout button) that trigger a server-side sign-out.
 */
export async function serverSignOut() {
  try {
    // Always use the current request's cookies to ensure Supabase session context is accurate.
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    // Server-side signOut ensures session cookies are invalidated on the server, not just the client.
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      // Log and rethrow to surface unexpected sign-out failures (e.g., network, session issues).
      console.error('Sign out error:', error)
      throw error
    }
  } catch (error) {
    // Even if sign-out fails, we log for observability but still redirect to enforce a clean auth state.
    console.error('Error in serverSignOut:', error)
    // Optionally, you could surface this error to the user or error boundary.
  }
  
  // Always redirect to login after sign-out, regardless of error, to prevent lingering in an invalid session.
  redirect('/login')
}