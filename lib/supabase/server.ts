import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
 
export function createSupabaseServerClient() {
  const cookieStore = cookies()
 
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `cookies().set()` method can only be called in a Server Action or Route Handler.
            // This error is typically caught and handled by Next.js automatically.
            // For example, in a Server Component, `cookies().set` would throw this error,
            // but it's acceptable for read operations.
            console.error('Error setting cookie on server:', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            console.error('Error removing cookie on server:', error);
          }
        },
      },
    }
  )
}