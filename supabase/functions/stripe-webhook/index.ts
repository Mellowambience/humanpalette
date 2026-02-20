// stripe-webhook
// Handles all critical Stripe events:
// - payment_intent.succeeded → release escrow / mark transaction complete
// - payment_intent.payment_failed → update transaction status
// - account.updated → sync artist Connect account status
// - transfer.created → record transfer ID on transaction
// - charge.dispute.created → flag transaction as disputed

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const { artwork_id, buyer_id } = pi.metadata;
        if (artwork_id && buyer_id) {
          // Purchase succeeded — mark escrowed
          await supabase.from('transactions')
            .update({ status: 'escrowed', escrowed_at: new Date().toISOString() })
            .eq('stripe_payment_intent', pi.id);
          // Mark artwork as sold
          await supabase.from('artworks').update({ status: 'sold' }).eq('id', artwork_id);
        } else {
          // Commitment fee captured (ghost scenario)
          await supabase.from('commitment_fees')
            .update({ status: 'forfeited', resolved_at: new Date().toISOString() })
            .eq('stripe_payment_intent', pi.id);
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await supabase.from('transactions')
          .update({ status: 'refunded' })
          .eq('stripe_payment_intent', pi.id);
        await supabase.from('commitment_fees')
          .update({ status: 'refunded', resolved_at: new Date().toISOString() })
          .eq('stripe_payment_intent', pi.id);
        break;
      }
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        if (account.charges_enabled && account.payouts_enabled) {
          await supabase.from('profiles')
            .update({ stripe_account_id: account.id })
            .eq('stripe_account_id', account.id);
        }
        break;
      }
      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer;
        const sourcePaymentIntent = (transfer as any).source_transaction;
        if (sourcePaymentIntent) {
          await supabase.from('transactions')
            .update({ stripe_transfer_id: transfer.id, status: 'released', released_at: new Date().toISOString() })
            .eq('stripe_payment_intent', sourcePaymentIntent);
        }
        break;
      }
      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        await supabase.from('transactions')
          .update({ status: 'disputed' })
          .eq('stripe_payment_intent', dispute.payment_intent as string);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('stripe-webhook error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
