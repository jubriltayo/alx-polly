import { PollForm } from '@/components/polls/PollForm';

export default function CreatePollPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Create New Poll</h1>
      <PollForm />
    </div>
  );
}
