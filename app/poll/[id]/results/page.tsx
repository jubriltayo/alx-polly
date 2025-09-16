import { createSupabaseServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import type { Database } from "@/lib/supabase/types"
import { RealtimePollResults } from "./RealtimePollResults";

interface PollResultsPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface Vote {
  option_id: string;
}

export default async function PollResultsPage(props: PollResultsPageProps) {
  const params = await props.params;
  const id = params.id;

  const cookieStore = cookies()
  const supabase = createSupabaseServerClient(cookieStore)

  const { data: poll, error: fetchError } = await supabase
  .from("polls")
  .select(`
    title, 
    description, 
    poll_options (*),
    votes (option_id)
  `)
  .eq("id", id)
  .single();

  if (fetchError) {
    console.error("Error fetching poll results:", fetchError)
  }

  if (!poll) {
    notFound()
  }

  // Calculate votes count manually if needed
  if (poll && poll.poll_options) {
    poll.poll_options.forEach(option => {
      option.votes_count = (poll.votes as Vote[])?.filter((vote: Vote) => vote.option_id === option.id).length || 0;
    });
  }

  // Ensure poll.poll_options is an array for initial state
  const initialPollOptions = poll.poll_options || [];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">{poll.title} - Results</h1>
      {poll.description && <p className="text-gray-600 mb-6">{poll.description}</p>}

      <RealtimePollResults initialPollOptions={initialPollOptions} pollId={id} />
    </div>
  )
}
