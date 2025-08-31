"use client";

import Link from 'next/link';
import React from 'react';
import { useAuth } from '@/lib/auth/AuthContext'; // Import useAuth hook

interface AuthButtonClientProps {
  userEmail: string | undefined | null;
  // serverSignOut: () => Promise<void>; // Removed as we will use signOut from context
}

export function AuthButtonClient({ userEmail }: AuthButtonClientProps) {
  const { signOut } = useAuth(); // Use the signOut from context

  const handleLogout = async () => {
    await signOut();
  };

  return userEmail ? (
    <div className="flex items-center gap-4">
      Hey, {userEmail}!
      <form action={handleLogout}>
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
  );
}
