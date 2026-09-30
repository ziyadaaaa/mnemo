import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required.' },
        { status: 400 }
      );
    }

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
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore cookie writes in this GET handler.
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized.' },
        { status: 401 }
      );
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: membership, error: membershipError } = await admin
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Workspace not found.' },
        { status: 404 }
      );
    }

    const { data: document, error: documentError } = await admin
      .from('documents')
      .select('id, title, file_path')
      .eq('id', id)
      .eq('workspace_id', membership.workspace_id)
      .maybeSingle();

    if (documentError || !document) {
      return NextResponse.json(
        { error: 'Document not found.' },
        { status: 404 }
      );
    }

    if (!document.file_path) {
      return NextResponse.json(
        { error: 'This document does not have an original file.' },
        { status: 404 }
      );
    }

    const { data: signedUrlData, error: signedUrlError } =
      await admin.storage
        .from('workspace-documents')
        .createSignedUrl(document.file_path, 60);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error(
        'Signed URL error:',
        signedUrlError
      );

      return NextResponse.json(
        { error: 'Could not create a secure file URL.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: signedUrlData.signedUrl,
      title: document.title,
    });
  } catch (error) {
    console.error(
      'Document file route error:',
      error
    );

    return NextResponse.json(
      { error: 'Could not open this document.' },
      { status: 500 }
    );
  }
}
