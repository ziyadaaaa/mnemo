import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const cookieStore = await cookies();

    // Get the currently signed-in Supabase user.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(
                ({ name, value, options }) => {
                  cookieStore.set(name, value, options);
                }
              );
            } catch {
              // Ignore cookie update errors in this server context.
            }
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: 'Not authenticated.',
        },
        { status: 401 }
      );
    }

    // Use the service-role client only on the server.
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Resolve the workspace from the authenticated user's
    // membership instead of trusting a workspaceId supplied
    // by the browser.
    const { data: membership, error: membershipError } =
      await admin
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

    if (membershipError) {
      console.error(
        'MEMORY WORKSPACE MEMBERSHIP ERROR:',
        membershipError
      );

      return NextResponse.json(
        {
          error: membershipError.message,
          code: membershipError.code,
          details: membershipError.details,
          hint: membershipError.hint,
        },
        { status: 500 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        {
          error: 'No workspace found for this account.',
        },
        { status: 404 }
      );
    }

    const workspaceId = membership.workspace_id;

    // Only retrieve memories belonging to the authenticated
    // user's actual workspace.
    const { data, error } = await admin
  .from('memories')
  .select(`
    *,
    outgoing_relationships:memory_relationships!source_memory_id(
      id,
      target_memory_id,
      relationship_type,
      confidence,
      created_at
    ),
    incoming_relationships:memory_relationships!target_memory_id(
      id,
      source_memory_id,
      relationship_type,
      confidence,
      created_at
    )
  `)
  .eq('workspace_id', workspaceId)
  .order('created_at', { ascending: false });

    if (error) {
      console.error(
        'MEMORIES QUERY ERROR:',
        error
      );

      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        workspaceId,
        data: data ?? [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'MEMORIES API ERROR:',
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}

