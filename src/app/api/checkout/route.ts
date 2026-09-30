
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured.' },
      { status: 503 }
    );
  }

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
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore cookie writes in this route.
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
        { error: 'You must be signed in to start checkout.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const priceId =
      body?.priceId || process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Stripe price is not configured.' },
        { status: 500 }
      );
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: membership, error: membershipError } =
      await admin
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

    const origin =
      req.headers.get('origin') ||
      'http://localhost:3000';

    const session =
      await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${origin}/workspace?success=true`,
        cancel_url: `${origin}/workspace?canceled=true`,
        customer_email: user.email || undefined,
        metadata: {
          userId: user.id,
          workspaceId: membership.workspace_id,
        },
        subscription_data: {
          metadata: {
            userId: user.id,
            workspaceId: membership.workspace_id,
          },
        },
      });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error: any) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Could not create Stripe checkout.',
      },
      { status: 500 }
    );
  }
}