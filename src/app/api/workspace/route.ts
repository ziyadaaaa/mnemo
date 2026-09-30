import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const cookieStore = await cookies();

    // Read the currently signed-in Supabase user.
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
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
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

    // Use the service role only on the server to securely
    // resolve the user's workspace membership.
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: membership, error: membershipError } = await admin
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      console.error(
        'WORKSPACE MEMBERSHIP ERROR:',
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

    // Fetch the actual workspace.
    const { data: workspace, error: workspaceError } = await admin
      .from('workspaces')
      .select('id, name, created_at')
      .eq('id', membership.workspace_id)
      .single();

    if (workspaceError || !workspace) {
      console.error(
        'WORKSPACE LOOKUP ERROR:',
        workspaceError
      );

      return NextResponse.json(
        {
          error:
            workspaceError?.message ||
            'Workspace could not be found.',
          code: workspaceError?.code ?? null,
          details: workspaceError?.details ?? null,
          hint: workspaceError?.hint ?? null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email ?? null,
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        createdAt: workspace.created_at,
      },
      role: membership.role,
    });
  } catch (error) {
    console.error('WORKSPACE API ERROR:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Something went wrong.',
      },
      { status: 500 }
    );
  }
}

