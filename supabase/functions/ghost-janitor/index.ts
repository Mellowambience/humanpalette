// ghost-janitor
// Daily cron: finds collectors who have gone silent for 7+ days on active matches,
// captures their commitment fee, applies trust score penalty, and marks match ghosted.
// Deploy with: supabase functions deploy ghost-janitor
// Schedule: every day at 00:00 UTC via pg_cron or external scheduler

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const GHOST_THRESHOLD_DAYS = 7;

serve(async (_req) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - GHOST_THRESHOLD_DAYS);

  // Find active matches with no message activity for 7+ days
  const { data: staleMatches, error } = await supabase
    .from('matches')
    .select('id, collector_id, created_at')
    .in('status', ['active', 'pending'])
    .lt('created_at', cutoff.toISOString());

  if (error) {
    console.error('ghost-janitor fetch error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let processed = 0;
  let errors = 0;

  for (const match of (staleMatches ?? [])) {
    try {
      // Check if there's been any message activity since cutoff
      const { data: recentMsg } = await supabase
        .from('messages')
        .select('id')
        .eq('match_id', match.id)
        .gt('created_at', cutoff.toISOString())
        .limit(1);

      if (recentMsg && recentMsg.length > 0) continue; // Active conversation, skip

      // Capture commitment fee
      const { data: fee } = await supabase
        .from('commitment_fees')
        .select('stripe_payment_intent, amount_cents')
        .eq('match_id', match.id)
        .eq('status', 'held')
        .single();

      if (fee?.stripe_payment_intent) {
        await stripe.paymentIntents.capture(fee.stripe_payment_intent);
      }

      // Mark match ghosted + apply trust score penalty
      const { error: ghostError } = await supabase.rpc('mark_match_ghosted', { p_match_id: match.id });
      if (ghostError) throw ghostError;

      processed++;
    } catch (err) {
      console.error(`ghost-janitor error for match ${match.id}:`, err);
      errors++;
    }
  }

  return new Response(JSON.stringify({
    processed,
    errors,
    checked: staleMatches?.length ?? 0,
    cutoff: cutoff.toISOString(),
  }), { headers: { 'Content-Type': 'application/json' } });
});
