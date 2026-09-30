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
      console.error('Billing auth error:', userError?.message);

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
        .select('workspace_id, role')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

    if (membershipError || !membership) {
      console.error('Billing membership error:', membershipError);

      return NextResponse.json(
        { error: 'Workspace not found.' },
        { status: 404 }
      );
    }

    const { data: subscription, error: subscriptionError } =
      await admin
        .from('subscriptions')
        .select(
          'status, price_id, current_period_end, stripe_customer_id, stripe_subscription_id'
        )
        .eq('workspace_id', membership.workspace_id)
        .maybeSingle();

    if (subscriptionError) {
      console.error(
        'Billing status error:',
        subscriptionError
      );

      return NextResponse.json(
        { error: 'Could not load billing status.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      workspaceId: membership.workspace_id,
      role: membership.role,
      subscription: subscription
        ? {
            status: subscription.status,
            priceId: subscription.price_id,
            currentPeriodEnd: subscription.current_period_end,
            hasSubscription: true,
          }
        : {
            status: 'inactive',
            priceId: null,
            currentPeriodEnd: null,
            hasSubscription: false,
          },
    });
  } catch (error) {
    console.error(
      'Billing status route error:',
      error
    );

    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}