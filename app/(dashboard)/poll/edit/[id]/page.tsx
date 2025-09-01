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

export default async function EditPollPage(props: EditPollPageProps) {
  const params = await props.params;
  const pollId = params.id;

  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

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

  if (error || !poll) {
    console.error('Error fetching poll for editing:', error);
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <EditPollForm initialPollData={poll} />
    </div>
  );
}
