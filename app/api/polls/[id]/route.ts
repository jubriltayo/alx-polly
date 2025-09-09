import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PollSchema } from '@/lib/utils/poll-validation';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { handleApiError } from '@/lib/utils/error-helpers';


// Helper function to handle authentication and poll authorization
async function getAuthAndPoll(pollId: string, cookieStore: ReturnType<typeof cookies>) {
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { response: new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }), supabase: null, user: null };
  }

  const { data: poll, error: fetchError } = await supabase
    .from('polls')
    .select('creator_id')
    .eq('id', pollId)
    .single();

  if (fetchError || !poll) {
    return { response: new NextResponse(JSON.stringify({ error: 'Poll not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    }), supabase, user };
  }

  if (poll.creator_id !== user.id) {
    return { response: new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }), supabase, user };
  }

  return { response: null, supabase, user };
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const pollId = params.id;

  const { response, supabase, user } = await getAuthAndPoll(pollId, cookieStore);
  if (response) {
    return response;
  }

  if (!supabase || !user) { // Should ideally not happen if response is null
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }

  try {
    const json = await request.json();
    const { title, description, options } = json;

    const parsed = PollSchema.safeParse({
      title,
      description: description || undefined,
      options: options.filter((option: string) => option.trim() !== ''),
    });

    if (!parsed.success) {
      return new NextResponse(
        JSON.stringify({ error: parsed.error.issues.map(issue => issue.message).join(', ') }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const validatedData = parsed.data;

    const { error: updatePollError } = await supabase
      .from('polls')
      .update({ title: validatedData.title, description: validatedData.description, updated_at: new Date().toISOString() })
      .eq('id', pollId);

    if (updatePollError) {
      return handleApiError(updatePollError);
    }

    const { error: deleteOptionsError } = await supabase
      .from('poll_options')
      .delete()
      .eq('poll_id', pollId);

    if (deleteOptionsError) {
      return handleApiError(deleteOptionsError);
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
      return handleApiError(insertOptionsError);
    }

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error('Unexpected error during poll update:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const pollId = params.id;

  const { response, supabase, user } = await getAuthAndPoll(pollId, cookieStore);
  if (response) {
    return response;
  }

  if (!supabase || !user) { // Should ideally not happen if response is null
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }

  try {
    const { error: deleteError } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);

    if (deleteError) {
      return handleApiError(deleteError);
    }

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error('Unexpected error during poll deletion:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}