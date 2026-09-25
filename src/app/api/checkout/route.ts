import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-28.acacia' as any,
});

export async function POST(req: Request) {
  try {
    const { priceId, workspaceId } = await req.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId, // Your Stripe recurring price ID (e.g., $49/mo team plan)
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
      },
      metadata: { workspaceId },
      success_url: `${req.headers.get('origin')}/workspace?success=true`,
      cancel_url: `${req.headers.get('origin')}/workspace/settings?canceled=true`,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
