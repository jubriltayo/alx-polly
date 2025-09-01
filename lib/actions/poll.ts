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

export async function deletePoll(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const pollId = formData.get('id') as string;

  if (!pollId) {
    return { error: 'Poll ID is required for deletion.' };
  }

  try {
    // Verify user is the creator before deleting
    const { data: poll, error: fetchError } = await supabase
      .from('polls')
      .select('creator_id')
      .eq('id', pollId)
      .single();

    if (fetchError || !poll) {
      console.error('Error fetching poll for deletion or poll not found:', fetchError);
      throw new Error('Poll not found or you don\'t have permission to delete it.');
    }

    if (poll.creator_id !== user.id) {
      throw new Error('You do not have permission to delete this poll.');
    }

    const { error: deleteError } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);

    if (deleteError) {
      console.error('Error deleting poll:', deleteError);
      throw new Error(deleteError.message || 'Failed to delete poll.');
    }

    revalidatePath('/dashboard');
    // Successfully deleted and revalidated, implicit void return is fine

  } catch (error) {
    // Check if the error is a Next.js redirect error and re-throw it
    if (error && typeof error === 'object' && 'message' in error && (error.message as string).includes('NEXT_REDIRECT')) {
      throw error; 
    }
    console.error('Unexpected error during poll deletion:', error);
    throw new Error('An unexpected error occurred during deletion.');
  }
}

export async function updatePoll(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const pollId = formData.get('id') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const options = formData.getAll('options[]') as string[];

  if (!pollId || !title || options.length < 2 || options.some(option => !option.trim())) {
    return { error: 'Poll ID, title, and at least two non-empty options are required for update.' };
  }

  try {
    // Verify user is the creator before updating
    const { data: existingPoll, error: fetchError } = await supabase
      .from('polls')
      .select('creator_id')
      .eq('id', pollId)
      .single();

    if (fetchError || !existingPoll) {
      console.error('Error fetching poll for update or poll not found:', fetchError);
      throw new Error('Poll not found or you don\'t have permission to update it.');
    }

    if (existingPoll.creator_id !== user.id) {
      throw new Error('You do not have permission to update this poll.');
    }

    // Update poll details
    const { error: updatePollError } = await supabase
      .from('polls')
      .update({ title, description, updated_at: new Date().toISOString() })
      .eq('id', pollId);

    if (updatePollError) {
      console.error('Error updating poll details:', updatePollError);
      throw new Error(updatePollError.message || 'Failed to update poll details.');
    }

    // Handle options: A more robust implementation would compare existing options
    // and perform inserts, updates, or deletes. For simplicity here, we'll delete
    // all existing options and re-insert new ones. This is acceptable for many cases
    // but might lose vote history if not carefully designed.

    // Delete existing options
    const { error: deleteOptionsError } = await supabase
      .from('poll_options')
      .delete()
      .eq('poll_id', pollId);

    if (deleteOptionsError) {
      console.error('Error deleting existing poll options:', deleteOptionsError);
      throw new Error(deleteOptionsError.message || 'Failed to update poll options.');
    }

    // Insert new options
    const optionsToInsert = options.map((optionText, index) => ({
      poll_id: pollId,
      text: optionText,
      order_index: index,
    }));

    const { error: insertOptionsError } = await supabase
      .from('poll_options')
      .insert(optionsToInsert);

    if (insertOptionsError) {
      console.error('Error inserting new poll options:', insertOptionsError);
      throw new Error(insertOptionsError.message || 'Failed to insert new poll options.');
    }

    revalidatePath('/dashboard');
    revalidatePath(`/poll/${pollId}`);
    redirect('/dashboard'); // Redirect to dashboard after successful update

  } catch (error) {
    // Check if the error is a Next.js redirect error and re-throw it
    if (error && typeof error === 'object' && 'message' in error && (error.message as string).includes('NEXT_REDIRECT')) {
      throw error; 
    }
    console.error('Unexpected error during poll update:', error);
    throw new Error('An unexpected error occurred during update.');
  }
}
