import React from 'react';
import Link from 'next/link';
import AuthButton from '@/components/auth/AuthButton';

export function Header() {
  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Polly
        </Link>
        <nav>
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}