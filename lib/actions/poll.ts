'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { PollSchema } from '@/lib/utils/poll-validation';
import { cookies } from 'next/headers';

export async function createPoll(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const options = formData.getAll('options[]') as string[];

  // Basic server-side validation
  if (!title || options.length < 2 || options.some(option => !option.trim())) {
    return { error: 'Title and at least two non-empty options are required.' };
  }

  try {
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .insert({ title, description, creator_id: user.id })
      .select()
      .single();

    if (pollError || !pollData) {
      console.error('Error creating poll:', pollError);
      return { error: pollError?.message || 'Failed to create poll.' };
    }

    const pollId = pollData.id;

    const optionsToInsert = options.map((optionText, index) => ({
      poll_id: pollId,
      text: optionText,
      order_index: index,
    }));

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsToInsert);

    if (optionsError) {
      console.error('Error creating poll options:', optionsError);
      // Optionally, roll back poll creation here
      return { error: optionsError.message || 'Failed to create poll options.' };
    }

    revalidatePath('/dashboard');
    redirect(`/poll/${pollId}`);

  } catch (error) {
    // Check if the error is a Next.js redirect error and re-throw it
    if (error && typeof error === 'object' && 'message' in error && (error.message as string).includes('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Unexpected error during poll creation:', error);
    return { error: 'An unexpected error occurred.' };
  }
}
