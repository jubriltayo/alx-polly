import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies, headers } from 'next/headers';
import { handleApiError } from '@/lib/utils/error-helpers';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);
  const pollId = params.id;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const json = await request.json();
    const { optionId } = json;

    if (!optionId) {
      return new NextResponse(
        JSON.stringify({ error: 'Option ID is required.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

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
        return new NextResponse(
          JSON.stringify({ error: 'You have already voted in this poll.' }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      return handleApiError(error);
    }

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error during vote submission:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}