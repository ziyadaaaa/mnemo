import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe webhook is not configured.' },
      { status: 503 }
    );
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing Stripe signature.' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (error: any) {
    console.error(
      'Webhook signature verification failed:',
      error?.message
    );

    return NextResponse.json(
      { error: 'Invalid webhook signature.' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session =
          event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.userId;
        const workspaceId = session.metadata?.workspaceId;
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

        if (!workspaceId) {
          console.error(
            'Checkout session is missing workspaceId metadata.'
          );
          break;
        }

        const subscription = subscriptionId
          ? await stripe.subscriptions.retrieve(subscriptionId)
          : null;

        const { error } = await admin
          .from('subscriptions')
          .upsert(
            {
              workspace_id: workspaceId,
              user_id: userId || null,
              stripe_customer_id:
                typeof session.customer === 'string'
                  ? session.customer
                  : session.customer?.id || null,
              stripe_subscription_id:
                subscription?.id || subscriptionId || null,
              status: subscription?.status || 'active',
              price_id:
                subscription?.items.data[0]?.price.id || null,
              current_period_end: subscription
                ? new Date(
                    subscription.items.data[0]?.current_period_end *
                      1000
                  ).toISOString()
                : null,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'workspace_id',
            }
          );

        if (error) {
          console.error(
            'Failed to save subscription:',
            error
          );
          return NextResponse.json(
            { error: 'Failed to save subscription.' },
            { status: 500 }
          );
        }

        console.log(
          `Subscription activated for workspace: ${workspaceId}`
        );

        break;
      }

      case 'customer.subscription.updated': {
        const subscription =
          event.data.object as Stripe.Subscription;

        const { error } = await admin
          .from('subscriptions')
          .update({
            status: subscription.status,
            price_id:
              subscription.items.data[0]?.price.id || null,
            current_period_end: subscription.items.data[0]
              ? new Date(
                  subscription.items.data[0].current_period_end * 1000
                ).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq(
            'stripe_subscription_id',
            subscription.id
          );

        if (error) {
          console.error(
            'Failed to update subscription:',
            error
          );
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription =
          event.data.object as Stripe.Subscription;

        const { error } = await admin
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq(
            'stripe_subscription_id',
            subscription.id
          );

        if (error) {
          console.error(
            'Failed to cancel subscription:',
            error
          );
        }

        break;
      }

      case 'invoice.paid':
        console.log('Stripe invoice paid.');
        break;

      case 'invoice.payment_failed':
        console.log('Stripe invoice payment failed.');
        break;

      default:
        console.log(
          `Unhandled Stripe event: ${event.type}`
        );
    }
  } catch (error) {
    console.error(
      'Stripe webhook processing error:',
      error
    );

    return NextResponse.json(
      { error: 'Webhook processing failed.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}