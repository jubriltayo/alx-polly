import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

// This function expects an already-awaited cookieStore from next/headers
export function createSupabaseServerClient(cookieStore: ReadonlyRequestCookies) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Add null check for cookieStore
          if (!cookieStore) {
            console.warn('CookieStore is undefined');
            return undefined;
          }
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // Add null check for cookieStore
            if (!cookieStore) {
              console.warn('CookieStore is undefined, cannot set cookie');
              return;
            }
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // This error is expected if set is called from a Server Component.
            // It will be handled by Next.js if a refresh occurs.
            console.error('Error setting cookie on server:', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // Add null check for cookieStore
            if (!cookieStore) {
              console.warn('CookieStore is undefined, cannot remove cookie');
              return;
            }
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            console.error('Error removing cookie on server:', error);
          }
        },
      },
    }
  )
}