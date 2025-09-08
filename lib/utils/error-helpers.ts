import { NextResponse } from 'next/server';
import { PostgrestError } from '@supabase/supabase-js';

export function handleNextRedirectError(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && (error.message as string).includes('NEXT_REDIRECT')) {
    throw error;
  }
}

export function handleApiError(error: PostgrestError | null) {
  const errorMessage = error?.message || 'An unexpected error occurred.';
  return new NextResponse(
    JSON.stringify({ error: errorMessage }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
