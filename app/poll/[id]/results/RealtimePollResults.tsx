'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';

type PollOption = Database['public']['Tables']['poll_options']['Row'];

interface RealtimePollResultsProps {
  initialPollOptions: PollOption[];
  pollId: string;
}

export function RealtimePollResults({ initialPollOptions, pollId }: RealtimePollResultsProps) {
  const [pollOptions, setPollOptions] = useState<PollOption[]>(initialPollOptions);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const refreshResults = async () => {
    setIsLoading(true);
    try {
      // Re-fetch and recalculate votes just like the server component
      const { data, error } = await supabase
        .from('polls')
        .select(`
          title, 
          description, 
          poll_options (*),
          votes (option_id)
        `)
        .eq('id', pollId)
        .single();
      
      if (!error && data && data.poll_options) {
        // Recalculate votes count
        const optionsWithCounts = data.poll_options.map(option => ({
          ...option,
          votes_count: (data.votes as any[])?.filter((vote: any) => vote.option_id === option.id).length || 0
        }));
        
        setPollOptions(optionsWithCounts);
      }
    } catch (error) {
      console.error('Error refreshing results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Optional: Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(refreshResults, 10000);
    return () => clearInterval(interval);
  }, [pollId]);

  const totalVotes = pollOptions.reduce((sum, option) => sum + option.votes_count, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500">
          Total votes: {totalVotes}
        </div>
        <Button onClick={refreshResults} disabled={isLoading} variant="outline" size="sm">
          {isLoading ? 'Refreshing...' : 'Refresh Results'}
        </Button>
      </div>

      {pollOptions.map((option) => {
        const percentage = totalVotes > 0 ? ((option.votes_count / totalVotes) * 100).toFixed(1) : '0';
        
        return (
          <div key={option.id} className="p-4 border rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <p className="text-lg font-medium">{option.value}</p>
              <p className="text-xl font-bold">{option.votes_count} votes ({percentage}%)</p>
            </div>
            {totalVotes > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}