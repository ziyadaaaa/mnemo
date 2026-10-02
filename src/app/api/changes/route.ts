import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const cookieStore = await cookies();

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

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: membership, error: membershipError } =
      await admin
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

    if (membershipError) {
      console.error(
        'CHANGES WORKSPACE MEMBERSHIP ERROR:',
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

    const { data, error } = await admin
      .from('memories')
      .select(`
        id,
        workspace_id,
        title,
        content,
        category,
        document_id,
        memory_type,
        confidence,
        occurred_at,
        metadata,
        parent_memory_id,
        relationship_type,
        created_at
      `)
      .eq('workspace_id', workspaceId)
      .eq('memory_type', 'change')
      .order('occurred_at', {
        ascending: false,
        nullsFirst: false,
      })
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      console.error(
        'CHANGES QUERY ERROR:',
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

    const changes = (data ?? []).map((memory) => ({
      id: memory.id,
      title: memory.title,
      content: memory.content,
      category: memory.category,
      document_id: memory.document_id,
      confidence: memory.confidence,
      occurred_at: memory.occurred_at,
      previous_value:
        memory.metadata?.previous_value ?? null,
      new_value:
        memory.metadata?.new_value ?? null,
      reason: memory.metadata?.reason ?? null,
      parent_memory_id: memory.parent_memory_id,
      relationship_type: memory.relationship_type,
      created_at: memory.created_at,
    }));

    return NextResponse.json(
      {
        success: true,
        workspaceId,
        data: changes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'CHANGES API ERROR:',
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