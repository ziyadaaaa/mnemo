import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      return NextResponse.json(
        { error: `Google authorization failed: ${error}` },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Missing Google authorization code.' },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Google OAuth is not configured.' },
        { status: 500 }
      );
    }

    // Get the currently authenticated Mnemo user.
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
        { error: 'You must be signed in to connect Google Drive.' },
        { status: 401 }
      );
    }

    // Find the user's workspace.
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

    if (membershipError || !membership) {
      console.error(
        'Google workspace lookup failed:',
        membershipError
      );

      return NextResponse.json(
        { error: 'Workspace not found.' },
        { status: 404 }
      );
    }

const redirectUri =
  'https://bug-free-happiness-xrpprv46xqxrhv67g-3000.app.github.dev/api/auth/google/callback';

    // Exchange Google's authorization code for tokens.
    const tokenResponse = await fetch(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error(
        'Google token exchange failed:',
        tokenData
      );

      return NextResponse.json(
        { error: 'Could not complete Google authorization.' },
        { status: 400 }
      );
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google did not return an access token.' },
        { status: 400 }
      );
    }

    // Get the Google account email.
    const profileResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const profile = await profileResponse.json();

    // Save the connection to the authenticated workspace.
    const { error: saveError } = await admin
      .from('google_connections')
      .upsert(
        {
          workspace_id: membership.workspace_id,
          user_id: user.id,
          google_email: profile.email || null,
          access_token: accessToken,
          refresh_token: refreshToken || null,
          token_expires_at: expiresIn
            ? new Date(
                Date.now() + expiresIn * 1000
              ).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'workspace_id',
        }
      );

    if (saveError) {
      console.error(
        'Failed to save Google connection:',
        saveError
      );

      return NextResponse.json(
        { error: 'Could not save Google connection.' },
        { status: 500 }
      );
    }

    // Return the user to the Mnemo Connections section.
    return NextResponse.redirect(
      `${url.origin}/workspace?google=connected`
    );
  } catch (error) {
    console.error(
      'Google OAuth callback error:',
      error
    );

    return NextResponse.json(
      { error: 'Google authorization failed.' },
      { status: 500 }
    );
  }
}