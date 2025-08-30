import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Example: Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/create')) {
    // TODO: Check auth (e.g., cookie, Supabase session)
    // If not authenticated, redirect to login
    // return NextResponse.redirect(new URL('/login', request.url));
  }
  // Allow public access to poll viewing
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/create/:path*'],
};
