import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { PollCard } from './PollCard';
import Link from 'next/link'; // Keep Link for Create New Poll button
import { Button } from '@/components/ui/button'; // Keep Button for Create New Poll button
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'; // Keep Card for the 'Create New Poll' card

export async function PollList() {
  const cookieStore = await cookies(); // Await cookies()
  const supabase = createSupabaseServerClient(cookieStore);

  const { data: polls, error } = await supabase
    .from('polls')
    .select('*, poll_options(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching polls:', error);
    return <p className="text-red-500">Error loading polls.</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {polls.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No Polls Yet</CardTitle>
            <CardDescription>Start a new poll to gather opinions</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Create your own custom poll with multiple options.</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/create">Create Poll</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        polls.map((poll) => (
          <PollCard key={poll.id} poll={poll} />
        ))
      )}
    </div>
  );
}
