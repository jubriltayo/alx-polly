"use client";

import Link from 'next/link';
import React from 'react'; // Ensure React is imported if using hooks or JSX

interface AuthButtonClientProps {
  userEmail: string | undefined | null;
  serverSignOut: () => Promise<void>; // The Server Action
}

export function AuthButtonClient({ userEmail, serverSignOut }: AuthButtonClientProps) {
  return userEmail ? (
    <div className="flex items-center gap-4">
      Hey, {userEmail}!
      <form action={serverSignOut}>
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
