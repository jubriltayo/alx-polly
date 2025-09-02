import { PublicPollList } from "@/components/polls/PublicPollList";
import { ToasterWithSearchParams } from '@/components/ToasterWithSearchParams';

interface PublicPollsPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function PublicPollsPage({ searchParams }: PublicPollsPageProps) {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">All Public Polls</h1>
      <PublicPollList />
      <ToasterWithSearchParams searchParams={searchParams} />
    </div>
  );
}
