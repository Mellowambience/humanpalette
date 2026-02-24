/**
 * admin-verify — HumanPalette Edge Function
 *
 * Approves or rejects a verification queue entry.
 *
 * POST /functions/v1/admin-verify
 * Body (approve): { queue_id, artist_id, wallet_address, action: 'approve' }
 * Body (reject):  { queue_id, artist_id, action: 'reject', admin_notes?: string }
 *
 * On approve:
 *   1. Calls eas-attest to write an on-chain attestation
 *   2. Sets artist_profiles.verification_status = 'verified'
 *   3. Stores EAS attestation UID in verification_queue.eas_attestation_uid
 *   4. Updates queue row: status = 'approved', reviewed_at = now()
 *   5. Fires push notification to artist via push-notify
 *
 * On reject:
 *   1. Updates queue row: status = 'rejected', notes = admin_notes, reviewed_at = now()
 *   2. Sets artist_profiles.verification_status = 'rejected'
 *   3. Fires push notification to artist via push-notify
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const { queue_id, artist_id, action, wallet_address, admin_notes } = body;

    if (!queue_id || !artist_id || !action) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();

    // ── APPROVE ──────────────────────────────────────────────────────────────
    if (action === 'approve') {
      if (!wallet_address) {
        return new Response(JSON.stringify({ error: 'wallet_address required for approve' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 1. Write EAS attestation by calling the eas-attest function internally
      const attestResp = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/eas-attest`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({ action: 'attest', artist_id, wallet_address }),
        }
      );

      const attestData = await attestResp.json();
      if (!attestResp.ok || !attestData.attestation_uid) {
        return new Response(
          JSON.stringify({ error: `EAS attestation failed: ${attestData.error ?? 'unknown'}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const attestation_uid: string = attestData.attestation_uid;

      // 2. Flip artist_profiles.verification_status → 'verified'
      await supabase
        .from('artist_profiles')
        .update({ verification_status: 'verified', verified_at: now })
        .eq('id', artist_id);

      // 3. Update queue row
      await supabase
        .from('verification_queue')
        .update({
          status: 'approved',
          reviewed_at: now,
          eas_attestation_uid: attestation_uid,
        })
        .eq('id', queue_id);

      // 4. Push notify artist
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/push-notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          type: 'verification_approved',
          user_id: artist_id,
        }),
      });

      return new Response(
        JSON.stringify({ success: true, attestation_uid }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── REJECT ───────────────────────────────────────────────────────────────
    if (action === 'reject') {
      await supabase
        .from('artist_profiles')
        .update({ verification_status: 'rejected' })
        .eq('id', artist_id);

      await supabase
        .from('verification_queue')
        .update({
          status: 'rejected',
          reviewed_at: now,
          notes: admin_notes ?? null,
        })
        .eq('id', queue_id);

      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/push-notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          type: 'verification_rejected',
          user_id: artist_id,
        }),
      });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
