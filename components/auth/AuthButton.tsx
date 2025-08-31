import { createSupabaseServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { serverSignOut } from '@/lib/actions/auth';

export default async function AuthButton() {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const signOut = async () => {
    await serverSignOut();
    return redirect('/login')
  }

  return user ? (
    <div className="flex items-center gap-4">
      Hey, {user.email}!
      <form action={signOut}>
        <button className="py-2 px-4 rounded-md no-underline bg-btn-background hover:bg-btn-background-hover">
          Logout
        </button>
      </form>
    </div>
  ) : (
    <Link
      href="/login"
      className="py-2 px-3 flex rounded-md no-underline bg-btn-background hover:bg-btn-background-hover"
    >
      Login
    </Link>
  )
}