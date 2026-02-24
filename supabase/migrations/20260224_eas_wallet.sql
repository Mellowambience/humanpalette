-- Migration: wallet address + EAS verification queue updates

ALTER TABLE artist_profiles
  ADD COLUMN IF NOT EXISTS wallet_address TEXT,
  ADD COLUMN IF NOT EXISTS wallet_chain   TEXT DEFAULT 'base';

CREATE INDEX IF NOT EXISTS idx_artist_profiles_wallet ON artist_profiles(wallet_address);

ALTER TABLE verification_queue
  ADD COLUMN IF NOT EXISTS eas_attestation_uid TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

CREATE OR REPLACE VIEW verified_artists AS
SELECT
  ap.id, ap.display_name, ap.username, ap.bio, ap.avatar_url, ap.wallet_address, ap.eas_attestation_uid,
  'https://base.easscan.org/attestation/view/' || ap.eas_attestation_uid AS attestation_url,
  ap.created_at
FROM artist_profiles ap
WHERE ap.is_human_verified = true AND ap.eas_attestation_uid IS NOT NULL;

GRANT SELECT ON verified_artists TO anon, authenticated;
