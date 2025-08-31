import { createSupabaseServerClient } from '@/lib/supabase/server';
// import { serverSignOut } from '@/lib/actions/auth'; // Removed as signOut is handled by AuthContext
import { AuthButtonClient } from './AuthButtonClient';
import { cookies } from 'next/headers';

export default async function AuthButton() {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return <AuthButtonClient userEmail={user?.email} />; // No longer passing serverSignOut
  } catch (error) {
    console.error('Error in AuthButton:', error);
    // Return a fallback UI if there's an error
    return <AuthButtonClient userEmail={null} />;
  }
}