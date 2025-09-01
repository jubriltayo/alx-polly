'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database } from '@/lib/supabase/types';
import { deletePoll } from '@/lib/actions/poll'; // Import deletePoll Server Action
import { useState } from 'react'; // Import useState

type Poll = Database['public']['Tables']['polls']['Row'] & { poll_options: Database['public']['Tables']['poll_options']['Row'][] };

interface PollCardProps {
  poll: Poll;
  showActions?: boolean; // New prop to control action button visibility
}

export function PollCard({ poll, showActions = true }: PollCardProps) {
  const [deleteError, setDeleteError] = useState<string | null>(null); // State for delete error
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
        {deleteError && <p className="text-red-500 text-sm mt-2">{deleteError}</p>}
      </CardContent>
      <CardFooter className="flex justify-between space-x-2">
        <Button asChild className="flex-1">
          <Link href={`/poll/${poll.id}`}>Vote</Link>
        </Button>
        {showActions && (
          <>
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/poll/edit/${poll.id}`}>Edit</Link>
            </Button>
            <form
              action={async (formData) => {
                if (!confirm('Are you sure you want to delete this poll?')) {
                  return;
                }
                setDeleteError(null); // Clear previous errors
                try {
                  await deletePoll(formData);
                } catch (error: any) {
                  setDeleteError(error.message || 'Failed to delete poll.');
                }
              }}
            >
              <input type="hidden" name="id" value={poll.id} />
              <Button type="submit" variant="destructive" className="flex-1">
                Delete
              </Button>
            </form>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
