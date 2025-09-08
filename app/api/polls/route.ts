import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PollSchema } from '@/lib/utils/poll-validation';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { handleApiError } from '@/lib/utils/error-helpers';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
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

    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .insert({ title: validatedData.title, description: validatedData.description, creator_id: user.id })
      .select()
      .single();

    if (pollError || !pollData) {
      console.error('Error creating poll:', pollError);
      return handleApiError(pollError);
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
      await supabase.from('polls').delete().eq('id', pollId);
      return handleApiError(optionsError);
    }

    return new NextResponse(JSON.stringify(pollData), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error during poll creation:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}