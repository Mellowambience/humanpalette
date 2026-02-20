// artist-connect-status
// Polls Stripe to check whether the artist's Connect account has
// completed onboarding (charges_enabled + payouts_enabled).
// Called by the stripe-onboard screen every 5 seconds after returning
// from the hosted Stripe UI.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req) => {
  try {
    const { artistId } = await req.json();
    if (!artistId) return new Response(JSON.stringify({ error: 'artistId required' }), { status: 400 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', artistId)
      .single();

    if (!profile?.stripe_account_id) {
      return new Response(JSON.stringify({ onboarded: false, needsSetup: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    const account = await stripe.accounts.retrieve(profile.stripe_account_id);

    const onboarded = account.charges_enabled && account.payouts_enabled;
    const needsInfo = (account.requirements?.currently_due?.length ?? 0) > 0;

    return new Response(JSON.stringify({
      onboarded,
      needsInfo,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      currentlyDue: account.requirements?.currently_due ?? [],
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('artist-connect-status error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
