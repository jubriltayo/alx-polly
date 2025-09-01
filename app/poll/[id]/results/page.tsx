import { createSupabaseServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import type { Database } from "@/lib/supabase/types"

interface PollResultsPageProps {
  params: {
    id: string
  }
}

type PollOptionWithVoteCount = Database["public"]["Tables"]["poll_options"]["Row"] & { vote_count: number }

export default async function PollResultsPage({ params }: PollResultsPageProps) {
  const id = params.id

  const cookieStore = cookies()
  const supabase = createSupabaseServerClient(cookieStore)

  let poll: null | { title: string; description: string; poll_options: PollOptionWithVoteCount[] } = null
  let error: any = null

  try {
    const { data, error: fetchError } = await supabase
      .from("polls")
      .select(
        `
        title,
        description,
        poll_options (
          id,
          text,
          votes (count)
        )
        `
      )
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching poll results:", fetchError)
      error = fetchError
    }

    if (data) {
      poll = {
        title: data.title,
        description: data.description,
        poll_options: data.poll_options.map(option => ({
          id: option.id,
          text: option.text,
          vote_count: (option.votes as { count: number }[])?.[0]?.count || 0,
        })).sort((a, b) => b.vote_count - a.vote_count),
      }
    }

  } catch (fetchErr) {
    console.error("❌ Supabase threw at fetch time:", fetchErr)
    error = fetchErr
  }

  if (error || !poll) {
    notFound()
  }

  const totalVotes = poll.poll_options.reduce((sum, option) => sum + option.vote_count, 0)

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">{poll.title} - Results</h1>
      {poll.description && <p className="text-gray-600 mb-6">{poll.description}</p>}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Vote Counts:</h2>
        {poll.poll_options.length > 0 ? (
          <div className="space-y-2">
            {poll.poll_options.map((option) => (
              <div key={option.id} className="flex items-center justify-between p-3 border rounded-md">
                <span className="text-lg font-medium">{option.text}</span>
                <span className="text-lg font-bold">{option.vote_count} votes ({totalVotes > 0 ? ((option.vote_count / totalVotes) * 100).toFixed(1) : 0}%)</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No options found for this poll.</p>
        )}
        <p className="text-lg font-semibold mt-4">Total Votes: {totalVotes}</p>
      </div>
    </div>
  )
}
