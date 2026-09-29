import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { companyName } = await request.json();

    if (!companyName || !companyName.trim()) {
      return NextResponse.json(
        { error: 'Company name is required.' },
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
              // Cookie updates can fail in some server contexts.
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
        { error: 'You must be signed in to create a workspace.' },
        { status: 401 }
      );
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Prevent accidentally creating multiple workspaces
    // if onboarding is submitted more than once.
    const { data: existingMembership, error: membershipCheckError } =
      await admin
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

    if (membershipCheckError) {
      console.error(membershipCheckError);

      return NextResponse.json(
        { error: 'Unable to check your existing workspace.' },
        { status: 500 }
      );
    }

    if (existingMembership) {
      return NextResponse.json({
        success: true,
        workspaceId: existingMembership.workspace_id,
      });
    }

    // Create the workspace.
    const { data: workspace, error: workspaceError } = await admin
      .from('workspaces')
      .insert({
        name: companyName.trim(),
      })
      .select('id, name')
      .single();

    if (workspaceError || !workspace) {
      console.error(workspaceError);

      return NextResponse.json(
        { error: 'Unable to create your workspace.' },
        { status: 500 }
      );
    }

    // Make the signed-in user the workspace owner.
    const { error: membershipError } = await admin
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'owner',
      });

    if (membershipError) {
      console.error(membershipError);

      // Clean up the workspace if membership creation failed.
      await admin
        .from('workspaces')
        .delete()
        .eq('id', workspace.id);

      return NextResponse.json(
        { error: 'Unable to finish workspace setup.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Something went wrong while creating your workspace.' },
      { status: 500 }
    );
  }
}