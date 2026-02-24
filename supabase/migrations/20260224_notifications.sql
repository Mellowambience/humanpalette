-- Migration: push_tokens table + DB triggers for notifications

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own push tokens" ON push_tokens FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION notify_user(p_type TEXT, p_recipient_id UUID, p_actor_name TEXT DEFAULT NULL, p_artwork_title TEXT DEFAULT NULL, p_message_preview TEXT DEFAULT NULL, p_match_id UUID DEFAULT NULL, p_artwork_id UUID DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/push-notify',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
    body := jsonb_build_object('type', p_type, 'recipient_id', p_recipient_id, 'actor_name', p_actor_name, 'artwork_title', p_artwork_title, 'message_preview', p_message_preview, 'match_id', p_match_id, 'artwork_id', p_artwork_id)
  );
END;
$$;

-- new match -> notify artist
CREATE OR REPLACE FUNCTION trigger_match_notify() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_title TEXT; v_name TEXT;
BEGIN
  SELECT title INTO v_title FROM artworks WHERE id = NEW.artwork_id;
  SELECT display_name INTO v_name FROM profiles WHERE id = NEW.collector_id;
  PERFORM notify_user('new_match', NEW.artist_id, v_name, v_title, NULL, NEW.id, NEW.artwork_id);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_match_created ON matches;
CREATE TRIGGER on_match_created AFTER INSERT ON matches FOR EACH ROW EXECUTE FUNCTION trigger_match_notify();

-- match accepted/declined -> notify collector
CREATE OR REPLACE FUNCTION trigger_match_status_notify() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_title TEXT; v_name TEXT;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  SELECT title INTO v_title FROM artworks WHERE id = NEW.artwork_id;
  SELECT display_name INTO v_name FROM profiles WHERE id = NEW.artist_id;
  IF NEW.status = 'accepted' THEN PERFORM notify_user('artist_accepted', NEW.collector_id, v_name, v_title, NULL, NEW.id, NEW.artwork_id);
  ELSIF NEW.status = 'declined' THEN PERFORM notify_user('artist_declined', NEW.collector_id, v_name, v_title, NULL, NEW.id, NEW.artwork_id);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_match_status_changed ON matches;
CREATE TRIGGER on_match_status_changed AFTER UPDATE OF status ON matches FOR EACH ROW EXECUTE FUNCTION trigger_match_status_notify();

-- new message -> notify other party
CREATE OR REPLACE FUNCTION trigger_message_notify() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_match matches%ROWTYPE; v_name TEXT; v_recipient UUID;
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = NEW.match_id;
  SELECT display_name INTO v_name FROM profiles WHERE id = NEW.sender_id;
  v_recipient := CASE WHEN NEW.sender_id = v_match.artist_id THEN v_match.collector_id ELSE v_match.artist_id END;
  PERFORM notify_user('new_message', v_recipient, v_name, NULL, LEFT(NEW.content, 80), NEW.match_id, NULL);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_message_created ON messages;
CREATE TRIGGER on_message_created AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION trigger_message_notify();

-- wishlist add -> notify artist
CREATE OR REPLACE FUNCTION trigger_wishlist_notify() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_art artworks%ROWTYPE; v_name TEXT;
BEGIN
  SELECT * INTO v_art FROM artworks WHERE id = NEW.artwork_id;
  SELECT display_name INTO v_name FROM profiles WHERE id = NEW.collector_id;
  PERFORM notify_user('new_wishlist', v_art.artist_id, v_name, v_art.title, NULL, NULL, NEW.artwork_id);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_wishlist_created ON wishlists;
CREATE TRIGGER on_wishlist_created AFTER INSERT ON wishlists FOR EACH ROW EXECUTE FUNCTION trigger_wishlist_notify();

-- purchase completed -> notify artist
CREATE OR REPLACE FUNCTION trigger_purchase_notify() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_title TEXT;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    SELECT title INTO v_title FROM artworks WHERE id = NEW.artwork_id;
    PERFORM notify_user('purchase_complete', NEW.artist_id, NULL, v_title, NULL, NULL, NEW.artwork_id);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_purchase_completed ON transactions;
CREATE TRIGGER on_purchase_completed AFTER INSERT OR UPDATE OF status ON transactions FOR EACH ROW EXECUTE FUNCTION trigger_purchase_notify();
