import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured.' },
      { status: 500 }
    );
  }

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);

  url.searchParams.set(
  'redirect_uri',
  'https://bug-free-happiness-xrpprv46xqxrhv67g-3000.app.github.dev/api/auth/google/callback'
);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set(
    'scope',
    [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/drive.readonly',
    ].join(' ')
  );
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');

  return NextResponse.redirect(url.toString());
}