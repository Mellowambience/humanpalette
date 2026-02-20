// artist-connect-onboard
// Creates a Stripe Connect Express account for the artist and returns
// an onboarding URL for them to complete KYC and bank setup.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const APP_URL = Deno.env.get('APP_URL') ?? 'humanpalette://';

serve(async (req) => {
  try {
    const { artistId } = await req.json();
    if (!artistId) return new Response(JSON.stringify({ error: 'artistId required' }), { status: 400 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, display_name')
      .eq('id', artistId)
      .single();

    let accountId = profile?.stripe_account_id;

    // Create Connect Express account if not exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        capabilities: { transfers: { requested: true }, card_payments: { requested: true } },
        metadata: { supabase_id: artistId },
      });
      accountId = account.id;
      await supabase.from('profiles').update({ stripe_account_id: accountId }).eq('id', artistId);
    }

    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}stripe-onboard?refresh=true`,
      return_url: `${APP_URL}stripe-onboard?success=true`,
      type: 'account_onboarding',
    });

    return new Response(JSON.stringify({
      onboardingUrl: accountLink.url,
      accountId,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('artist-connect-onboard error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
