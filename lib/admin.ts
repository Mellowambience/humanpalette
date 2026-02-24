import { supabase } from './supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface QueueEntry {
  id: string;
  artist_id: string;
  artist_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  wallet_address: string | null;
  ai_score: number | null;
  proof_urls: string[] | null;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
  eas_attestation_uid: string | null;
}

export interface VerifiedArtist {
  id: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  eas_attestation_uid: string | null;
  attestation_url: string | null;
  created_at: string;
}

interface AdminActionResult {
  error?: string;
  attestation_uid?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch verification queue joined with profile info.
 * Ordered by pending first, then by submission date.
 */
export async function fetchQueue(): Promise<QueueEntry[]> {
  const { data, error } = await supabase
    .from('verification_queue')
    .select(`
      id,
      artist_id,
      notes,
      status,
      submitted_at:created_at,
      reviewed_at,
      eas_attestation_uid,
      artist_profiles!inner (
        username,
        wallet_address,
        ai_score,
        proof_urls
      ),
      profiles!inner (
        display_name,
        bio,
        avatar_url
      )
    `)
    .order('status', { ascending: true }) // pending < approved/rejected alphabetically
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[admin] fetchQueue:', error.message);
    return [];
  }

  // Flatten the nested joins into a flat QueueEntry
  return (data ?? []).map((row: any) => ({
    id: row.id,
    artist_id: row.artist_id,
    artist_name: row.profiles?.display_name ?? null,
    username: row.artist_profiles?.username ?? null,
    avatar_url: row.profiles?.avatar_url ?? null,
    bio: row.profiles?.bio ?? null,
    wallet_address: row.artist_profiles?.wallet_address ?? null,
    ai_score: row.artist_profiles?.ai_score ?? null,
    proof_urls: row.artist_profiles?.proof_urls ?? null,
    notes: row.notes,
    status: row.status,
    submitted_at: row.submitted_at,
    reviewed_at: row.reviewed_at,
    eas_attestation_uid: row.eas_attestation_uid,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Approve an artist:
 * 1. Calls the `admin-verify` Edge Function (writes EAS attestation + flips verification_status)
 * 2. Returns the attestation UID on success
 */
export async function approveArtist(entry: QueueEntry): Promise<AdminActionResult> {
  if (!entry.wallet_address) {
    return { error: 'Artist has no wallet address on file. Ask them to add one before approving.' };
  }

  const { data, error } = await supabase.functions.invoke('admin-verify', {
    body: {
      queue_id: entry.id,
      artist_id: entry.artist_id,
      wallet_address: entry.wallet_address,
      action: 'approve',
    },
  });

  if (error) return { error: error.message };
  return { attestation_uid: data?.attestation_uid };
}

/**
 * Reject an artist:
 * Updates queue row status → rejected, writes optional notes.
 */
export async function rejectArtist(entry: QueueEntry, adminNotes: string): Promise<AdminActionResult> {
  const { data, error } = await supabase.functions.invoke('admin-verify', {
    body: {
      queue_id: entry.id,
      artist_id: entry.artist_id,
      action: 'reject',
      admin_notes: adminNotes,
    },
  });

  if (error) return { error: error.message };
  return {};
}

/**
 * Revoke an EAS attestation for a verified artist.
 * Calls the `eas-attest` Edge Function with action=revoke.
 */
export async function revokeAttestation(artist: VerifiedArtist): Promise<AdminActionResult> {
  if (!artist.eas_attestation_uid) {
    return { error: 'No attestation UID found for this artist.' };
  }

  const { data, error } = await supabase.functions.invoke('eas-attest', {
    body: {
      action: 'revoke',
      attestation_uid: artist.eas_attestation_uid,
    },
  });

  if (error) return { error: error.message };
  return {};
}
