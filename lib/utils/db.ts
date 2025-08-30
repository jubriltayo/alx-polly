import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

export async function getPollById(id: string) {
  return supabase
    .from('polls')
    .select('*')
    .eq('id', id)
    .single();
}

export async function getPolls() {
  return supabase
    .from('polls')
    .select('*')
    .order('created_at', { ascending: false });
}

export async function createPoll(poll: Partial<Database['public']['Tables']['polls']['Insert']>) {
  return supabase
    .from('polls')
    .insert([poll]);
}

export async function voteOnPoll(vote: Partial<Database['public']['Tables']['votes']['Insert']>) {
  return supabase
    .from('votes')
    .insert([vote]);
}

export async function getPollResults(pollId: string) {
  return supabase
    .from('votes')
    .select('option_id, count:option_id')
    .eq('poll_id', pollId)
    .group('option_id');
}
