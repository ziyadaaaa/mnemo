import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error: 'Memory ID is required.',
        },
        { status: 400 }
      );
    }

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

    // Server-only admin client.
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Resolve the workspace belonging to the signed-in user.
    const { data: membership, error: membershipError } =
      await admin
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

    if (membershipError) {
      console.error(
        'DELETE MEMORY MEMBERSHIP ERROR:',
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

    // Delete ONLY if the memory belongs to the user's workspace.
    const { data: deletedMemory, error: deleteError } =
      await admin
        .from('memories')
        .delete()
        .eq('id', id)
        .eq('workspace_id', workspaceId)
        .select('id, title')
        .maybeSingle();

    if (deleteError) {
      console.error(
        'DELETE MEMORY ERROR:',
        deleteError
      );

      return NextResponse.json(
        {
          error: deleteError.message,
          code: deleteError.code,
          details: deleteError.details,
          hint: deleteError.hint,
        },
        { status: 500 }
      );
    }

    if (!deletedMemory) {
      return NextResponse.json(
        {
          error: 'Memory not found in your workspace.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        deleted: deletedMemory,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'DELETE MEMORY API ERROR:',
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

