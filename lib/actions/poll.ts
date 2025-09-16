'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { PollSchema } from '@/lib/utils/poll-validation';
import { cookies, headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/utils/auth-helpers';
import { handleNextRedirectError } from '@/lib/utils/error-helpers';

/**
 * Purpose:
 *   Creates a new poll and its associated options in the database for the authenticated user.
 *
 * Why:
 *   Centralizes poll creation logic to ensure data validation, atomicity, and consistent error handling.
 *   Built as a Server Action to leverage secure, server-side form processing and Supabase integration.
 *
 * Assumptions:
 *   - Assumes the caller is an authenticated user (enforced by getAuthenticatedUser).
 *   - Expects formData to contain 'title', 'description', and one or more 'options[]' fields.
 *
 * Edge cases:
 *   - If poll option creation fails after poll insertion, the function rolls back by deleting the poll to prevent orphaned records.
 *   - Returns user-friendly error messages for validation failures or database errors; unexpected errors are logged and a generic error is returned.
 *   - Handles empty or whitespace-only options by filtering them out before validation.
 *
 * Used by:
 *   - Invoked by the poll creation form via a Server Action to process user submissions.
 *   - Triggers UI updates by revalidating the dashboard path and redirects to the poll list with a status message on success.
 */
export async function createPoll(formData: FormData) {
  // Get the authenticated user and a Supabase client bound to their session.
  const { user, supabase } = await getAuthenticatedUser();

  // Extract poll fields from the form submission.
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const options = formData.getAll('options[]') as string[];

  // Remove empty/whitespace-only options before validation.
  // This ensures users can't submit blank poll options.
  const parsed = PollSchema.safeParse({
    title,
    // Convert empty string to undefined so Zod treats it as "not provided" for optional fields.
    description: description || undefined,
    options: options.filter(option => option.trim() !== ''),
  });

  if (!parsed.success) {
    // Aggregate all validation errors into a single error message for the UI.
    return { error: parsed.error.issues.map(issue => issue.message).join(', ') };
  }

  const validatedData = parsed.data;

  try {
    // Insert the poll and return the created row in a single DB roundtrip.
    // Using .single() ensures we only get one poll back (should always be the case).
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .insert({ title: validatedData.title, description: validatedData.description, creator_id: user.id, is_active: true })
      .select()
      .single();

    if (pollError || !pollData) {
      // If poll creation fails, surface the DB error (if any) to the user.
      console.error('Error creating poll:', pollError);
      return { error: pollError?.message || 'Failed to create poll.' };
    }

    const pollId = pollData.id;

    // Prepare poll options for bulk insert, preserving user-specified order.
    // order_index is used to maintain the order in which options were entered.
    const optionsToInsert = validatedData.options.map((optionText, index) => ({
      poll_id: pollId,
      value: optionText,
      order_index: index,
    }));

    // Insert all poll options in a single DB call for efficiency.
    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsToInsert);

    if (optionsError) {
      // If options insert fails, delete the poll to avoid orphaned polls with no options.
      // This manual rollback is necessary because Supabase doesn't support multi-table transactions.
      console.error('Error creating poll options:', optionsError);
      await supabase.from('polls').delete().eq('id', pollId);
      return { error: optionsError.message || 'Failed to create poll options.' };
    }

    // Revalidate the dashboard so the new poll appears immediately for the user.
    revalidatePath('/dashboard');
    // Redirect to the poll list with a success message.
    redirect('/polls?status=success&message=Poll+created+successfully!');

  } catch (error) {
    // handleNextRedirectError will rethrow redirect errors so they aren't swallowed.
    // Any other unexpected errors are logged and surfaced as a generic error.
    handleNextRedirectError(error);
    console.error('Unexpected error during poll creation:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

/**
 * Purpose:
 *   Deletes a poll from the database if the authenticated user is its creator.
 *
 * Why:
 *   Ensures only poll creators can remove their polls, enforcing access control and data integrity at the server level.
 *   Centralizes deletion logic to prevent unauthorized or accidental poll removal from the client side.
 *
 * Assumptions:
 *   - The function is called as a Server Action with a valid FormData object containing the poll ID.
 *   - The user is authenticated and the Supabase client is initialized with their session.
 *
 * Edge cases:
 *   - If the poll ID is missing, the function returns an error immediately.
 *   - If the poll does not exist or the user is not the creator, deletion is denied and an error is returned.
 *   - Any Supabase or unexpected errors are caught, logged, and surfaced as user-friendly error messages.
 *   - On successful deletion, the dashboard path is revalidated to reflect the change.
 *
 * Used by:
 *   - Invoked by Server Actions triggered from UI components (e.g., a "Delete" button in the dashboard) to securely handle poll deletion.
 *   - Can be integrated into forms or buttons that require server-side validation and mutation of poll data.
 */
export async function deletePoll(formData: FormData) {
  const { user, supabase } = await getAuthenticatedUser();

  const pollId = formData.get('id') as string;

  if (!pollId) {
    // Defensive: Don't proceed if poll ID is missing from the form submission.
    return { error: 'Poll ID is required for deletion.' };
  }

  try {
    // Fetch only the creator_id to check poll ownership without leaking other poll data.
    const { data: poll, error: fetchError } = await supabase
      .from('polls')
      .select('creator_id')
      .eq('id', pollId)
      .single();

    if (fetchError || !poll) {
      // If poll doesn't exist or DB error, don't reveal which for security; generic error message.
      console.error('Error fetching poll for deletion or poll not found:', fetchError);
      return { error: 'Poll not found or you don\'t have permission to delete it.' };
    }

    if (poll.creator_id !== user.id) {
      // Business rule: Only the poll creator can delete their poll.
      return { error: 'You do not have permission to delete this poll.' };
    }

    // Attempt to delete the poll. No cascading delete: related options/votes must be handled by DB triggers or constraints.
    const { error: deleteError } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);

    if (deleteError) {
      // Log and surface DB errors, but don't expose sensitive details to the client.
      console.error('Error deleting poll:', deleteError);
      return { error: deleteError.message || 'Failed to delete poll.' };
    }

    // Invalidate dashboard cache so UI reflects poll removal immediately.
    revalidatePath('/dashboard');
    return { success: true };

  } catch (error) {
    // handleNextRedirectError ensures Next.js redirect errors are rethrown, not swallowed.
    handleNextRedirectError(error);
    // Log unexpected errors for debugging; return generic error to client.
    console.error('Unexpected error during poll deletion:', error);
    return { error: 'An unexpected error occurred during deletion.' };
  }
}

/**
 * Updates an existing poll's title, description, and options in the database.
 *
 * Purpose:
 *   - Handles server-side validation and mutation for editing a poll, ensuring only the poll creator can update poll details and options.
 *
 * Why:
 *   - Centralizes poll update logic to enforce business rules (ownership, validation) and maintain data integrity, especially since poll options are replaced wholesale on edit.
 *
 * Assumptions:
 *   - The provided FormData includes a valid poll ID, title, and an array of non-empty options.
 *   - The user is authenticated and the Supabase client is properly initialized via getAuthenticatedUser().
 *
 * Edge cases:
 *   - If the poll does not exist or the user is not the creator, returns a permission error.
 *   - If validation fails (e.g., missing title or all options are empty), returns a descriptive error.
 *   - If any database operation fails (updating poll, deleting old options, inserting new options), returns a specific error message and logs details for debugging.
 *   - All previous poll options are deleted and replaced; partial updates to options are not supported.
 *
 * Used by:
 *   - Invoked by Server Actions from UI forms (e.g., an "Edit Poll" form in the dashboard) to securely process poll edits.
 *   - Relies on Next.js revalidatePath and redirect to update relevant pages and navigate after a successful update.
 */
export async function updatePoll(formData: FormData) {
  const { user, supabase } = await getAuthenticatedUser();

  const pollId = formData.get('id') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const options = formData.getAll('options[]') as string[];

  // Remove empty options before validation; ensures only meaningful options are processed.
  const parsed = PollSchema.safeParse({
    title,
    description: description || undefined,
    options: options.filter(option => option.trim() !== ''),
  });

  if (!parsed.success) {
    // Aggregate all validation errors into a single error message for the client.
    return { error: parsed.error.issues.map(issue => issue.message).join(', ') };
  }

  const validatedData = parsed.data;

  if (!pollId) {
    // Defensive: pollId is required for update, should never be missing if form is correct.
    return { error: 'Poll ID is required for update.' };
  }

  try {
    // Fetch poll to verify existence and ownership before allowing update.
    const { data: existingPoll, error: fetchError } = await supabase
      .from('polls')
      .select('creator_id')
      .eq('id', pollId)
      .single();

    if (fetchError || !existingPoll) {
      // Don't leak DB errors; generic error for not found or unauthorized.
      console.error('Error fetching poll for update or poll not found:', fetchError);
      return { error: 'Poll not found or you don\'t have permission to update it.' };
    }

    // Only the poll creator can update; prevents unauthorized edits.
    if (existingPoll.creator_id !== user.id) {
      return { error: 'You do not have permission to update this poll.' };
    }

    // Update poll metadata (title, description, updated_at timestamp).
    const { error: updatePollError } = await supabase
      .from('polls')
      .update({ title: validatedData.title, description: validatedData.description, updated_at: new Date().toISOString(), is_active: true })
      .eq('id', pollId);

    if (updatePollError) {
      // Log DB error for debugging, but return generic error to client.
      console.error('Error updating poll details:', updatePollError);
      return { error: updatePollError.message || 'Failed to update poll details.' };
    }

    // Remove all existing options before inserting new ones.
    // This "replace all" approach simplifies option management but means partial edits aren't supported.
    const { error: deleteOptionsError } = await supabase
      .from('poll_options')
      .delete()
      .eq('poll_id', pollId);

    if (deleteOptionsError) {
      // If option deletion fails, abort to avoid inconsistent state.
      console.error('Error deleting existing poll options:', deleteOptionsError);
      return { error: deleteOptionsError.message || 'Failed to update poll options.' };
    }

    // Prepare new options for bulk insert, preserving order via order_index.
    const optionsToInsert = validatedData.options.map((optionText, index) => ({
      poll_id: pollId,
      value: optionText,
      order_index: index,
    }));

    // Insert all new options in a single DB call for efficiency.
    const { error: insertOptionsError } = await supabase
      .from('poll_options')
      .insert(optionsToInsert);

    if (insertOptionsError) {
      // If insert fails, poll will have no options; log for investigation.
      console.error('Error inserting new poll options:', insertOptionsError);
      return { error: insertOptionsError.message || 'Failed to insert new poll options.' };
    }

    // Invalidate relevant pages so UI reflects changes immediately.
    revalidatePath('/dashboard');
    revalidatePath(`/poll/${pollId}`);
    // Redirect to dashboard after successful update.
    redirect('/dashboard');

  } catch (error) {
    // Special handling for Next.js redirect errors; don't swallow them.
    handleNextRedirectError(error);
    // Log unexpected errors for ops, but return generic error to user.
    console.error('Unexpected error during poll update:', error);
    return { error: 'An unexpected error occurred during update.' };
  }
}

/**
 * Purpose:
 *   Submits a user's vote for a specific poll option, recording relevant metadata and handling duplicate voting.
 *
 * Why:
 *   Centralizes vote submission logic to ensure all votes are consistently tracked with user/session context, prevent duplicate votes, and trigger UI updates via revalidation and redirect.
 *   Designed as a Server Action to leverage secure, server-side state and minimize client-side complexity.
 *
 * Assumptions:
 *   - Expects a FormData object containing valid 'pollId' and 'optionId' fields.
 *   - Assumes Supabase is properly initialized and accessible, and that the 'votes' table enforces unique constraints to prevent duplicate votes.
 *
 * Edge cases:
 *   - If required form fields are missing, returns a user-friendly error.
 *   - Handles unique constraint violations (duplicate votes) gracefully, returning a specific error message.
 *   - Catches and logs unexpected errors, returning a generic error to the user.
 *   - Gathers IP address, user agent, and session fingerprint for auditability, defaulting to 'UNKNOWN' if unavailable.
 *
 * Used by:
 *   - Invoked by poll voting forms as a Server Action to process vote submissions.
 *   - Triggers revalidation of poll and results pages and redirects the user to the results view after a successful vote.
 */
export async function submitVote(formData: FormData) {
  const { supabase, user } = await getServerClient();
  const pollId = formData.get('pollId') as string;
  const optionId = formData.get('optionId') as string;

  if (!pollId || !optionId) {
    return { error: 'Poll ID and selected option are required.' };
  }

  try {
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'UNKNOWN';
    const userAgent = headersList.get('user-agent') || 'UNKNOWN';
    
    let sessionFingerprint = null;
    
    if (!user) {
      sessionFingerprint = `${ipAddress}-${userAgent}`;
    }

    // Check for existing vote
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq(user ? 'user_id' : 'session_fingerprint', user ? user.id : sessionFingerprint)
      .maybeSingle();

    if (existingVote) {
      return { error: 'You have already voted in this poll.' };
    }

    // STEP 1: Insert the vote
    const { error: voteError } = await supabase
      .from('votes')
      .insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: user?.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        session_fingerprint: sessionFingerprint
      });

    if (voteError) {
      console.error('Vote insertion error:', voteError);
      return { error: 'Failed to submit vote. Please try again.' };
    }

    // STEP 2: MANUALLY update votes_count - SIMPLE AND DIRECT
    const { error: updateError } = await supabase
      .from('poll_options')
      .update({ 
        votes_count: await getCurrentVotesCount(supabase, optionId) + 1 
      })
      .eq('id', optionId);

    if (updateError) {
      console.error('Votes count update error:', updateError);
      // Don't return error - the vote was recorded successfully
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

// Helper function to get current votes count
async function getCurrentVotesCount(supabase: any, optionId: string): Promise<number> {
  const { data, error } = await supabase
    .from('poll_options')
    .select('votes_count')
    .eq('id', optionId)
    .single();

  if (error || !data) {
    console.error('Error getting current votes count:', error);
    return 0;
  }

  return data.votes_count || 0;
}
