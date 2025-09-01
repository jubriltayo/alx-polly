import React from 'react';
import { PollList } from '@/components/polls/PollList';

export default function PollsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">My Polls</h1>
      <PollList />
    </div>
  );
}
