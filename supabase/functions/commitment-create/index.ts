// commitment-create
// Creates a match + manual-capture Stripe PaymentIntent for the commitment fee
// when a collector swipes right on an artwork.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const COMMITMENT_FEE_CENTS = 500; // $5.00 base

serve(async (req) => {
  try {
    const { artworkId, artistId, collectorId } = await req.json();
    if (!artworkId || !artistId || !collectorId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Get collector's commitment multiplier (trust score affects fee)
    const { data: cp } = await supabase
      .from('collector_profiles')
      .select('commitment_multiplier, trust_score')
      .eq('id', collectorId)
      .single();

    const multiplier = cp?.commitment_multiplier ?? 1.0;
    const feeCents = Math.round(COMMITMENT_FEE_CENTS * multiplier);

    // Get or create Stripe customer for this collector
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, display_name')
      .eq('id', collectorId)
      .single();

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ metadata: { supabase_id: collectorId } });
      customerId = customer.id;
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', collectorId);
    }

    // Create manual-capture PaymentIntent (hold, not charge)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: feeCents,
      currency: 'usd',
      customer: customerId,
      capture_method: 'manual',
      metadata: { artwork_id: artworkId, artist_id: artistId, collector_id: collectorId },
    });

    // Create the match row
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({ collector_id: collectorId, artist_id: artistId, artwork_id: artworkId, status: 'pending' })
      .select()
      .single();
    if (matchError) throw matchError;

    // Record commitment fee
    await supabase.from('commitment_fees').insert({
      match_id: match.id,
      collector_id: collectorId,
      amount_cents: feeCents,
      stripe_payment_intent: paymentIntent.id,
      status: 'held',
    });

    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret,
      feeCents,
      matchId: match.id,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('commitment-create error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
