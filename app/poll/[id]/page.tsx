import { createSupabaseServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import type { Database } from "@/lib/supabase/types"

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
      <h1 className="text-3xl font-bold mb-4">{poll.title}</h1>
      {poll.description && <p className="text-gray-600 mb-6">{poll.description}</p>}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Options:</h2>
        {poll.poll_options.length > 0 ? (
          <ul className="list-disc pl-5">
            {poll.poll_options.map((opt) => (
              <li key={opt.id} className="text-lg">
                {opt.text}
              </li>
            ))}
          </ul>
        ) : (
          <p>No options found for this poll.</p>
        )}
      </div>
    </div>
  )
}