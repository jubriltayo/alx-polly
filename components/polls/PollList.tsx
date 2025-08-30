import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function PollList() {
  // Placeholder data for polls
  const polls = [
    { id: 1, title: 'Favorite Programming Language', votes: 42, created: '2 days ago' },
    { id: 2, title: 'Best Frontend Framework', votes: 36, created: '5 days ago' },
    { id: 3, title: 'Most Useful Developer Tool', votes: 28, created: '1 week ago' },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {polls.map((poll) => (
        <Card key={poll.id}>
          <CardHeader>
            <CardTitle>{poll.title}</CardTitle>
            <CardDescription>{poll.votes} votes  b7 {poll.created}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Click to view poll details and vote</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/polls/${poll.id}`}>View Poll</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
      
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Create New Poll</CardTitle>
          <CardDescription>Start a new poll to gather opinions</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Create your own custom poll with multiple options</p>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/create-poll">Create Poll</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
