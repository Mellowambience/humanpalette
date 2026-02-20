// purchase-create
// Full purchase flow: escrow with artist/platform split via Stripe Connect.
// Handles personal, display, and commercial use types with pricing uplifts.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const PLATFORM_FEE_PCT = 0.075; // 7.5%

serve(async (req) => {
  try {
    const { matchId, artworkId, buyerId, useType } = await req.json();

    // Fetch artwork details
    const { data: artwork } = await supabase
      .from('artworks')
      .select('price, commercial_price, allows_commercial, artist_id, artist:profiles!artist_id(stripe_account_id)')
      .eq('id', artworkId)
      .single();
    if (!artwork) throw new Error('Artwork not found');

    const basePriceCents = Math.round(artwork.price * 100);
    let commercialUpliftCents = 0;

    if (useType === 'commercial') {
      if (!artwork.allows_commercial) throw new Error('Commercial use not permitted for this artwork');
      const commercialPrice = artwork.commercial_price ?? artwork.price * 1.25;
      commercialUpliftCents = Math.round((commercialPrice - artwork.price) * 100);
    }

    const totalCents = basePriceCents + commercialUpliftCents;
    const platformFeeCents = Math.floor(totalCents * PLATFORM_FEE_PCT);
    const artistPayoutCents = totalCents - platformFeeCents;

    // Get or create buyer Stripe customer
    const { data: buyerProfile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', buyerId).single();
    let customerId = buyerProfile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ metadata: { supabase_id: buyerId } });
      customerId = customer.id;
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', buyerId);
    }

    const artistStripeAccountId = (artwork.artist as any)?.stripe_account_id;
    if (!artistStripeAccountId) throw new Error('Artist has not completed Stripe onboarding');

    // Create PaymentIntent with application fee (Stripe Connect direct charge)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      customer: customerId,
      application_fee_amount: platformFeeCents,
      transfer_data: { destination: artistStripeAccountId },
      metadata: { artwork_id: artworkId, buyer_id: buyerId, use_type: useType, match_id: matchId ?? '' },
    });

    // Record transaction
    const { data: tx } = await supabase.from('transactions').insert({
      match_id: matchId,
      artwork_id: artworkId,
      buyer_id: buyerId,
      artist_id: artwork.artist_id,
      use_type: useType,
      base_price_cents: basePriceCents,
      commercial_uplift_cents: commercialUpliftCents,
      platform_fee_cents: platformFeeCents,
      artist_payout_cents: artistPayoutCents,
      stripe_payment_intent: paymentIntent.id,
      status: 'pending',
    }).select().single();

    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret,
      totalCents,
      platformFeeCents,
      artistPayoutCents,
      transactionId: tx?.id,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('purchase-create error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
