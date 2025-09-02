import { createSupabaseServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import type { Database } from "@/lib/supabase/types"
import { VoteForm } from "@/components/polls/VoteForm"

interface PollPageProps {
  params: Promise<{
    id: string
  }>
}

type PollOption = Database["public"]["Tables"]["poll_options"]["Row"]

export default async function PollPage(props: PollPageProps) {
  const params = await props.params
  const id = params.id

  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient(cookieStore)

  let poll: null | { title: string; description: string; poll_options: PollOption[] } = null
  let error: any = null

  try {
    const result = await supabase.from("polls").select(`title, description, poll_options (*)`).eq("id", id).single()
    poll = result.data
    error = result.error
  } catch (fetchErr) {
    console.error("❌ Supabase threw at fetch time:", fetchErr)
    error = fetchErr
  }

  if (error || !poll) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-extrabold mb-4 text-center">{poll.title}</h1>
      {poll.description && <p className="text-gray-600 mb-6 text-center">{poll.description}</p>}

      <div className="mt-8 max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-6 text-center">Cast Your Vote</h2>
        <VoteForm pollId={id} options={poll.poll_options} />
      </div>
    </div>
  )
}