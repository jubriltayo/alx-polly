import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PollSchema } from '@/lib/utils/poll-validation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { handleApiError } from '@/lib/utils/error-helpers';


// Helper function to handle authentication and poll authorization
async function getAuthAndPoll(pollId: string, cookieStore: ReturnType<typeof cookies>) {
  const supabase = createSupabaseServerClient(cookieStore);
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

export async function PUT(request: Request, params: Promise<{ id: string }>) {
  const cookieStore = cookies();
  const { id: pollId } = await params;

  const { response, supabase, user } = await getAuthAndPoll(pollId, cookieStore);
  if (response) {
    return response;
  }

  if (!supabase || !user) { // Should ideally not happen if response is null
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }

  try {
    const json = await request.json();
    const { title, description, options } = json ?? {};
    const normalizedOptions = Array.isArray(options) ? options.filter((option: unknown) => typeof option === 'string' && option.trim() !== '') : [];

    const parsed = PollSchema.safeParse({
      title,
      description: typeof description === 'string' && description.trim() !== '' ? description : undefined,
      options: normalizedOptions,
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

    const { error: rpcError } = await supabase
      .rpc('update_poll_with_options', {
        p_poll_id: pollId,
        p_title: validatedData.title,
        p_description: validatedData.description ?? null,
        p_options: validatedData.options,
      });

    if (rpcError) {
      return handleApiError(rpcError);
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

export async function DELETE(request: Request, params: Promise<{ id: string }>) {
  const cookieStore = cookies();
  const { id: pollId } = await params;

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