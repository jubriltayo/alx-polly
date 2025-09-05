import React from 'react';
import { PollList } from '@/components/polls/PollList';

/**
 * Purpose:
 *   Renders the main dashboard page listing all polls created by the currently authenticated user.
 *
 * Why:
 *   Centralizes the user's poll management in a single, easily accessible view. This separation ensures
 *   that only authenticated users see their own polls, supporting privacy and a clear user experience.
 *
 * Assumptions:
 *   - Assumes the user is authenticated before accessing this page (enforced by route protection elsewhere).
 *   - Assumes <PollList /> is a Server Component that fetches and displays the user's polls from Supabase.
 *
 * Edge cases:
 *   - If the user has no polls, <PollList /> is expected to handle and display an appropriate empty state.
 *   - Any Supabase or data-fetching errors are handled within <PollList />, so this page remains simple.
 *
 * Used by:
 *   - The Next.js App Router as the default export for the /dashboard route segment.
 *   - Navigated to after successful login or from other authenticated areas of the app.
 */
export default function PollsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">My Polls</h1>
      {/* <PollList /> encapsulates all poll-fetching and error/empty state logic for this user */}
      <PollList />
    </div>
  );
}
