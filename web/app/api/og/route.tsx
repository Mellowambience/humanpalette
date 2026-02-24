import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET(request: NextRequest) {
  const handle = new URL(request.url).searchParams.get('handle');
  const { data: artist } = handle ? await supabase.from('artist_profiles').select('display_name, bio, is_human_verified, artworks(media_url)').eq('username', handle).single() : { data: null };
  const artworks = (artist?.artworks as any[]) ?? [];

  return new ImageResponse((
    <div style={{ display: 'flex', width: '100%', height: '100%', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a3e 100%)', padding: 60, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
        <span style={{ color: '#a78bfa', fontSize: 20, fontWeight: 700, marginBottom: 32 }}>🎨 HumanPalette</span>
        <h1 style={{ fontSize: 56, fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.1 }}>{artist?.display_name ?? handle ?? 'HumanPalette'}</h1>
        {artist?.is_human_verified && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 30, padding: '6px 16px', width: 'fit-content' }}><span style={{ color: '#10b981', fontSize: 18, fontWeight: 700 }}>✓ Human Verified</span></div>}
        {artist?.bio && <p style={{ color: '#9ca3af', fontSize: 20, marginTop: 20, maxWidth: 500 }}>{(artist.bio as string).slice(0, 100)}</p>}
        <p style={{ color: '#6b7280', fontSize: 16, marginTop: 24 }}>{artworks.length} works · humanpalette.app/artist/{handle}</p>
      </div>
      {artworks.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginLeft: 48 }}>{artworks.slice(0, 2).map((art: any, i: number) => <img key={i} src={art.media_url} style={{ width: 220, height: 220, borderRadius: 16, objectFit: 'cover', border: '2px solid rgba(124,58,237,0.4)' }} />)}</div>}
    </div>
  ), { width: 1200, height: 630 });
}
