import React from 'react';
import { CreatePollForm } from '@/app/components/polls/create-poll-form';

export default function CreatePollPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Create New Poll</h1>
      <CreatePollForm />
    </div>
  );
}