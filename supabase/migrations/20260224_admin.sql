-- Admin dashboard migration
-- Adds proof_urls to artist_profiles and status/notes to verification_queue

-- Proof media URLs (WIP photos/videos uploaded during verification application)
ALTER TABLE artist_profiles
  ADD COLUMN IF NOT EXISTS proof_urls TEXT[] DEFAULT '{}';

-- AI detection score (0-100, set by ai-detect Edge Function)
-- Column may already exist from prior migration; safe to re-add with IF NOT EXISTS
ALTER TABLE artist_profiles
  ADD COLUMN IF NOT EXISTS ai_score INTEGER;

-- Ensure verification_queue has the columns admin-verify writes to
-- (eas_attestation_uid + reviewed_at were added in migration 3; safe to re-run)
ALTER TABLE verification_queue
  ADD COLUMN IF NOT EXISTS eas_attestation_uid TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Queue status should support 'pending' | 'approved' | 'rejected'
-- If status column doesn't exist yet, add it
ALTER TABLE verification_queue
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected'));

-- Index for fast pending queue loads
CREATE INDEX IF NOT EXISTS idx_verification_queue_status
  ON verification_queue(status, created_at);

-- Admin role check: protect admin-verify from being called by non-admins.
-- Add an `is_admin` flag to profiles (set manually for now; can be role-based later)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- RLS: only admins can read the verification queue
ALTER TABLE verification_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin reads queue" ON verification_queue;
CREATE POLICY "Admin reads queue"
  ON verification_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- Artists can insert their own queue entry
DROP POLICY IF EXISTS "Artist submits to queue" ON verification_queue;
CREATE POLICY "Artist submits to queue"
  ON verification_queue FOR INSERT
  WITH CHECK (auth.uid() = artist_id);
