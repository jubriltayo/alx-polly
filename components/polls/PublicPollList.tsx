import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { PollCard } from './PollCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export async function PublicPollList() {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { data: polls, error } = await supabase
    .from('polls')
    .select('*, poll_options(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching public polls:', error);
    return <p className="text-red-500">Error loading polls.</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {polls.length === 0 ? (
        <p className="text-center text-gray-500 col-span-full">No public polls available yet.</p>
      ) : (
        polls.map((poll) => (
          <PollCard key={poll.id} poll={poll} showActions={false} />
        ))
      )}
    </div>
  );
}
