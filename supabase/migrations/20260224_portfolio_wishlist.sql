-- Migration: public portfolio + wishlist support

ALTER TABLE artist_profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS eas_attestation_uid TEXT;

UPDATE artist_profiles ap
SET username = LOWER(REPLACE(p.display_name, ' ', '_'))
FROM profiles p
WHERE ap.id = p.id AND ap.username IS NULL;

CREATE INDEX IF NOT EXISTS idx_artist_profiles_username ON artist_profiles(username);

DROP POLICY IF EXISTS "Public read artist profiles" ON artist_profiles;
CREATE POLICY "Public read artist profiles" ON artist_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read listed artworks" ON artworks;
CREATE POLICY "Public read listed artworks" ON artworks FOR SELECT USING (status = 'listed');

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collector_id, artwork_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_collector ON wishlists(collector_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_artwork ON wishlists(artwork_id);
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collectors manage their own wishlists" ON wishlists FOR ALL USING (auth.uid() = collector_id) WITH CHECK (auth.uid() = collector_id);
CREATE POLICY "Artists read wishlist counts" ON wishlists FOR SELECT USING (EXISTS (SELECT 1 FROM artworks a WHERE a.id = wishlists.artwork_id AND a.artist_id = auth.uid()));

ALTER TABLE artworks ADD COLUMN IF NOT EXISTS ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100);
