import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { EditPollForm } from '@/components/polls/EditPollForm';
import { Database } from '@/lib/supabase/types';

type Poll = Database['public']['Tables']['polls']['Row'] & { poll_options: Database['public']['Tables']['poll_options']['Row'][] };

interface EditPollPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Purpose:
 *   Renders the poll editing page, fetching the specified poll and its options for editing by the owner.
 *
 * Why:
 *   Ensures only the correct poll (with all its options) is loaded for editing, supporting granular poll management and enforcing data integrity.
 *   Fetching on the server guarantees up-to-date data and leverages Next.js Server Components for security and performance.
 *
 * Assumptions:
 *   - The user is authenticated and authorized to edit the poll (enforced elsewhere).
 *   - The poll ID provided in the route params is valid and accessible to the current user.
 *
 * Edge cases:
 *   - If the poll does not exist or a database error occurs, the user is shown a 404 page (notFound).
 *   - Handles cases where the poll exists but has no options, or where Supabase returns a null result.
 *
 * Used by:
 *   - The Next.js App Router as the page component for /poll/edit/[id].
 *   - Consumed by navigation from the dashboard or poll management UI.
 */
export default async function EditPollPage(props: EditPollPageProps) {
  // Awaiting params as it's a Promise (Next.js dynamic route convention)
  const params = await props.params;
  const pollId = params.id;

  // Use cookies to create a Supabase client scoped to the current user session
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  // Fetch the poll and its options in a single query for atomicity and to avoid partial data
  const { data: poll, error } = await supabase
    .from('polls')
    .select(
      `
      *,
      poll_options (*)
    `
    )
    .eq('id', pollId)
    .single();

  // If the poll is missing or a DB error occurs, treat as not found for security and UX
  if (error || !poll) {
    console.error('Error fetching poll for editing:', error);
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      {/* Passes the fetched poll (with options) to the edit form for pre-population */}
      <EditPollForm initialPollData={poll} />
    </div>
  );
}
