'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database } from '@/lib/supabase/types';

type Poll = Database['public']['Tables']['polls']['Row'] & { poll_options: Database['public']['Tables']['poll_options']['Row'][] };

interface PollCardProps {
  poll: Poll;
}

export function PollCard({ poll }: PollCardProps) {
  // Placeholder for vote count - actual vote count would require fetching from the 'votes' table
  const voteCount = 0; // Temporarily set to 0 until vote fetching is implemented

  return (
    <Card>
      <CardHeader>
        <CardTitle>{poll.title}</CardTitle>
        <CardDescription>
          {poll.description && <p className="mb-2">{poll.description}</p>}
          Created: {poll.created_at ? new Date(poll.created_at).toLocaleDateString() : 'N/A'}
          {voteCount > 0 && ` | ${voteCount} votes`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">Options: {poll.poll_options.length}</p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/poll/${poll.id}`}>View Poll</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
