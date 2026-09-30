import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

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
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Ignore cookie writes in this server context.
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
        { error: 'Not authenticated.' },
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
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Workspace not found.' },
        { status: 404 }
      );
    }

    const { data: connection, error: connectionError } =
      await admin
        .from('google_connections')
        .select(
          'google_email, token_expires_at, created_at, updated_at'
        )
        .eq('workspace_id', membership.workspace_id)
        .maybeSingle();

    if (connectionError) {
      console.error(
        'Google connection lookup failed:',
        connectionError
      );

      return NextResponse.json(
        { error: 'Could not load Google connection.' },
        { status: 500 }
      );
    }

    if (!connection) {
      return NextResponse.json({
        connected: false,
        email: null,
        tokenExpiresAt: null,
      });
    }

    return NextResponse.json({
      connected: true,
      email: connection.google_email,
      tokenExpiresAt: connection.token_expires_at,
    });
  } catch (error) {
    console.error(
      'Google status route error:',
      error
    );

    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}