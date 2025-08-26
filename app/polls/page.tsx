import React from 'react';
import { PollList } from '@/app/components/polls/poll-list';

export default function PollsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">All Polls</h1>
      <PollList />
    </div>
  );
}