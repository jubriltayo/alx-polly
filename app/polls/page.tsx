import { PublicPollList } from "@/components/polls/PublicPollList";

export default function PublicPollsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">All Public Polls</h1>
      <PublicPollList />
    </div>
  );
}
