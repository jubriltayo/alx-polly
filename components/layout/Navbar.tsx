import AuthButton from '@/components/auth/AuthButton';
import Link from 'next/link';

export function Navbar() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="font-bold text-xl">
          Alx-Polly
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium hover:underline">
            Polls
          </Link>
          <Link href="/create" className="text-sm font-medium hover:underline">
            Create Poll
          </Link>
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
