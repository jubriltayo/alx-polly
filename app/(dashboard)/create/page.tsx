import { PollForm } from '@/components/polls/PollForm';

/**
 * Purpose:
 *   Renders the "Create New Poll" page, providing a form for authenticated users to create a new poll.
 *
 * Why:
 *   Centralizes poll creation in a dedicated route, ensuring a clear separation between poll creation and poll management.
 *   This approach supports a focused user experience and simplifies permission enforcement for poll creation.
 *
 * Assumptions:
 *   - Assumes the user is authenticated before accessing this page (enforced by route protection elsewhere).
 *   - Assumes <PollForm /> is a Server or Client Component that handles all form logic, validation, and submission.
 *
 * Edge cases:
 *   - If <PollForm /> encounters errors (e.g., Supabase/network issues), it is responsible for displaying error states.
 *   - If the user is not authenticated, upstream middleware or layout should redirect or block access.
 *
 * Used by:
 *   - The Next.js App Router as the default export for the /create route segment.
 *   - Navigated to from the dashboard or other authenticated areas when a user wants to create a new poll.
 */
export default function CreatePollPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Create New Poll</h1>
      {/* <PollForm /> encapsulates all poll creation logic, including validation and error handling */}
      <PollForm />
    </div>
  );
}
