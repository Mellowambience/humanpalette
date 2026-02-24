import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Expo } from 'https://esm.sh/expo-server-sdk@3';

const expo = new Expo({ accessToken: Deno.env.get('EXPO_ACCESS_TOKEN') });
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const TEMPLATES: Record<string, (p: any) => { title: string; body: string }> = {
  new_match: (p) => ({ title: '💌 New match request', body: `${p.actor_name ?? 'A collector'} wants to discuss "${p.artwork_title ?? 'your artwork'}"` }),
  new_message: (p) => ({ title: `💬 ${p.actor_name ?? 'New message'}`, body: p.message_preview ?? 'You have a new message' }),
  artist_accepted: (p) => ({ title: '🎨 Artist accepted!', body: `${p.actor_name ?? 'The artist'} accepted your request for "${p.artwork_title ?? 'the artwork'}"` }),
  artist_declined: (p) => ({ title: 'Match declined', body: `${p.actor_name ?? 'The artist'} passed on this one` }),
  purchase_complete: (p) => ({ title: '🎉 Sale confirmed!', body: `"${p.artwork_title ?? 'Your artwork'}" has been purchased` }),
  new_wishlist: (p) => ({ title: '❤️ Added to wishlist', body: `${p.actor_name ?? 'A collector'} saved "${p.artwork_title ?? 'your artwork'}"` }),
};

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const payload = await req.json();

  const { data: tokenRow } = await supabase.from('push_tokens').select('token').eq('user_id', payload.recipient_id).single();
  if (!tokenRow?.token) return new Response(JSON.stringify({ ok: true, skipped: 'no_token' }), { status: 200 });

  if (!Expo.isExpoPushToken(tokenRow.token)) return new Response(JSON.stringify({ ok: false, error: 'invalid_token' }), { status: 400 });

  const template = TEMPLATES[payload.type]?.(payload) ?? { title: 'HumanPalette', body: 'New notification' };

  try {
    const [ticket] = await expo.sendPushNotificationsAsync([{ to: tokenRow.token, sound: 'default', title: template.title, body: template.body, data: { type: payload.type, match_id: payload.match_id, artwork_id: payload.artwork_id }, badge: 1, priority: 'high', channelId: 'default' }]);
    if (ticket.status === 'error') {
      if (ticket.details?.error === 'DeviceNotRegistered') await supabase.from('push_tokens').delete().eq('user_id', payload.recipient_id);
      return new Response(JSON.stringify({ ok: false, error: ticket.message }), { status: 500 });
    }
    return new Response(JSON.stringify({ ok: true, ticket }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});
