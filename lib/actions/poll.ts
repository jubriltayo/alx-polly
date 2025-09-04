'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { PollSchema } from '@/lib/utils/poll-validation';
import { cookies, headers } from 'next/headers';
import { getAuthenticatedUser } from '@/lib/utils/auth-helpers';
import { handleNextRedirectError } from '@/lib/utils/error-helpers';

export async function createPoll(formData: FormData) {
  const { user, supabase } = await getAuthenticatedUser();

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const options = formData.getAll('options[]') as string[];

  const parsed = PollSchema.safeParse({
    title,
    description: description || undefined, // Zod treats empty string as valid for optional string
    options: options.filter(option => option.trim() !== ''),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map(issue => issue.message).join(', ') };
  }

  const validatedData = parsed.data;

  try {
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .insert({ title: validatedData.title, description: validatedData.description, creator_id: user.id })
      .select()
      .single();

    if (pollError || !pollData) {
      console.error('Error creating poll:', pollError);
      return { error: pollError?.message || 'Failed to create poll.' };
    }

    const pollId = pollData.id;

    const optionsToInsert = validatedData.options.map((optionText, index) => ({
      poll_id: pollId,
      text: optionText,
      order_index: index,
    }));

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsToInsert);

    if (optionsError) {
      console.error('Error creating poll options:', optionsError);
      await supabase.from('polls').delete().eq('id', pollId); // Rollback poll creation
      return { error: optionsError.message || 'Failed to create poll options.' };
    }

    revalidatePath('/dashboard');
    redirect('/polls?status=success&message=Poll+created+successfully!');

  } catch (error) {
    handleNextRedirectError(error);
    console.error('Unexpected error during poll creation:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function deletePoll(formData: FormData) {
  const { user, supabase } = await getAuthenticatedUser();

  const pollId = formData.get('id') as string;

  if (!pollId) {
    return { error: 'Poll ID is required for deletion.' };
  }

  try {
    const { data: poll, error: fetchError } = await supabase
      .from('polls')
      .select('creator_id')
      .eq('id', pollId)
      .single();

    if (fetchError || !poll) {
      console.error('Error fetching poll for deletion or poll not found:', fetchError);
      return { error: 'Poll not found or you don\'t have permission to delete it.' };
    }

    if (poll.creator_id !== user.id) {
      return { error: 'You do not have permission to delete this poll.' };
    }

    const { error: deleteError } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);

    if (deleteError) {
      console.error('Error deleting poll:', deleteError);
      return { error: deleteError.message || 'Failed to delete poll.' };
    }

    revalidatePath('/dashboard');
    return { success: true };

  } catch (error) {
    handleNextRedirectError(error);
    console.error('Unexpected error during poll deletion:', error);
    return { error: 'An unexpected error occurred during deletion.' };
  }
}

export async function updatePoll(formData: FormData) {
  const { user, supabase } = await getAuthenticatedUser();

  const pollId = formData.get('id') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const options = formData.getAll('options[]') as string[];

  const parsed = PollSchema.safeParse({
    title,
    description: description || undefined,
    options: options.filter(option => option.trim() !== ''),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map(issue => issue.message).join(', ') };
  }

  const validatedData = parsed.data;

  if (!pollId) {
    return { error: 'Poll ID is required for update.' };
  }

  try {
    const { data: existingPoll, error: fetchError } = await supabase
      .from('polls')
      .select('creator_id')
      .eq('id', pollId)
      .single();

    if (fetchError || !existingPoll) {
      console.error('Error fetching poll for update or poll not found:', fetchError);
      return { error: 'Poll not found or you don\'t have permission to update it.' };
    }

    if (existingPoll.creator_id !== user.id) {
      return { error: 'You do not have permission to update this poll.' };
    }

    const { error: updatePollError } = await supabase
      .from('polls')
      .update({ title: validatedData.title, description: validatedData.description, updated_at: new Date().toISOString() })
      .eq('id', pollId);

    if (updatePollError) {
      console.error('Error updating poll details:', updatePollError);
      return { error: updatePollError.message || 'Failed to update poll details.' };
    }

    const { error: deleteOptionsError } = await supabase
      .from('poll_options')
      .delete()
      .eq('poll_id', pollId);

    if (deleteOptionsError) {
      console.error('Error deleting existing poll options:', deleteOptionsError);
      return { error: deleteOptionsError.message || 'Failed to update poll options.' };
    }

    const optionsToInsert = validatedData.options.map((optionText, index) => ({
      poll_id: pollId,
      text: optionText,
      order_index: index,
    }));

    const { error: insertOptionsError } = await supabase
      .from('poll_options')
      .insert(optionsToInsert);

    if (insertOptionsError) {
      console.error('Error inserting new poll options:', insertOptionsError);
      return { error: insertOptionsError.message || 'Failed to insert new poll options.' };
    }

    revalidatePath('/dashboard');
    revalidatePath(`/poll/${pollId}`);
    redirect('/dashboard');

  } catch (error) {
    handleNextRedirectError(error);
    console.error('Unexpected error during poll update:', error);
    return { error: 'An unexpected error occurred during update.' };
  }
}

export async function submitVote(formData: FormData) {
  const { user, supabase } = await getAuthenticatedUser();

  const pollId = formData.get('pollId') as string;
  const optionId = formData.get('optionId') as string;

  if (!pollId || !optionId) {
    return { error: 'Poll ID and selected option are required.' };
  }

  try {
    const headersList = headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'UNKNOWN';
    const userAgent = headersList.get('user-agent') || 'UNKNOWN';
    const sessionFingerprint = cookies().get('session_fingerprint')?.value || 'UNKNOWN';

    let voteData: any = {
      poll_id: pollId,
      option_id: optionId,
      ip_address: ipAddress,
      user_agent: userAgent,
      session_fingerprint: sessionFingerprint,
    };

    if (user) {
      voteData.user_id = user.id;
    }

    const { error } = await supabase
      .from('votes')
      .insert(voteData);

    if (error) {
      if (error.code === '23505') {
        return { error: 'You have already voted in this poll.' };
      }
      console.error('Error submitting vote:', error);
      return { error: error.message || 'Failed to submit vote.' };
    }

    revalidatePath(`/poll/${pollId}`);
    revalidatePath(`/poll/${pollId}/results`);
    redirect(`/poll/${pollId}/results`);

  } catch (error) {
    handleNextRedirectError(error);
    console.error('Unexpected error during vote submission:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

