import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    try {
      const cookieStore = await cookies()
      const supabase = createSupabaseServerClient(cookieStore)
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      
      console.error('Auth exchange error:', error)
    } catch (error) {
      console.error('Error in auth callback:', error)
    }
  }

  // return the user to an error page with some error message
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired`)
}