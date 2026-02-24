import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Props = { params: { handle: string } };
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: artist } = await supabase.from('artist_profiles').select('display_name, bio, avatar_url, artworks(media_url)').eq('username', params.handle).single();
  if (!artist) return { title: 'Artist not found — HumanPalette' };
  const img = (artist.artworks as any[])?.[0]?.media_url;
  return {
    title: `${artist.display_name} — Human-made art on HumanPalette`,
    description: artist.bio || `Browse verified human-made artworks by ${artist.display_name} on HumanPalette.`,
    openGraph: { title: `${artist.display_name} on HumanPalette`, description: artist.bio || '', images: img ? [{ url: img, width: 1200, height: 630 }] : [], type: 'profile' },
    twitter: { card: 'summary_large_image', title: `${artist.display_name} on HumanPalette`, images: img ? [img] : [] },
    alternates: { canonical: `https://humanpalette.app/artist/${params.handle}` },
  };
}

export default async function ArtistPortfolioPage({ params }: Props) {
  const { data: artist, error } = await supabase.from('artist_profiles').select(`id, display_name, bio, avatar_url, username, is_human_verified, eas_attestation_uid, created_at, artworks!artworks_artist_id_fkey(id, title, media_url, price_cents, is_human_verified, status, created_at)`).eq('username', params.handle).single();
  if (error || !artist) notFound();

  const listed = ((artist.artworks as any[]) ?? []).filter((a) => a.status === 'listed').sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const attestationUrl = artist.eas_attestation_uid ? `https://base.easscan.org/attestation/view/${artist.eas_attestation_uid}` : null;
  const appStoreUrl = 'https://apps.apple.com/app/humanpalette';

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="font-bold text-lg text-violet-400">HumanPalette</Link>
        <a href={appStoreUrl} className="text-sm text-gray-400 hover:text-white transition-colors">Download App →</a>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-start gap-5 mb-8">
          {artist.avatar_url ? <Image src={artist.avatar_url} alt={artist.display_name} width={80} height={80} className="rounded-full object-cover flex-shrink-0" /> : <div className="w-20 h-20 rounded-full bg-violet-900 flex items-center justify-center text-3xl font-bold text-violet-300 flex-shrink-0">{artist.display_name?.charAt(0)?.toUpperCase()}</div>}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold mb-1">{artist.display_name}</h1>
            {artist.is_human_verified && (
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 bg-emerald-900/60 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-700/50">✓ Human Verified</span>
                {attestationUrl && <a href={attestationUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-violet-400 transition-colors">On-chain proof ↗</a>}
              </div>
            )}
            {artist.bio && <p className="text-gray-400 text-sm leading-relaxed max-w-lg">{artist.bio}</p>}
          </div>
        </div>
        <div className="flex gap-6 mb-8 pb-6 border-b border-white/10">
          <div><p className="text-2xl font-bold text-violet-400">{listed.length}</p><p className="text-xs text-gray-500">Works</p></div>
          <div><p className="text-2xl font-bold text-violet-400">{listed.filter((a: any) => a.is_human_verified).length}</p><p className="text-xs text-gray-500">Verified</p></div>
        </div>
        {listed.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
            {listed.map((art: any) => (
              <div key={art.id} className="group relative rounded-xl overflow-hidden bg-zinc-900">
                <div className="relative aspect-square"><Image src={art.media_url} alt={art.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 50vw, 33vw" /></div>
                {art.is_human_verified && <div className="absolute top-2 left-2 bg-emerald-900/80 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">✓ Verified</div>}
                <div className="px-3 py-2"><p className="text-xs text-gray-400 truncate">{art.title}</p><p className="text-xs text-violet-400 font-semibold">${(art.price_cents / 100).toLocaleString()}</p></div>
              </div>
            ))}
          </div>
        ) : <div className="text-center py-16 text-gray-600"><p className="text-4xl mb-3">🎨</p><p>No artworks listed yet.</p></div>}
        <div className="rounded-2xl bg-gradient-to-br from-violet-900/60 to-purple-900/40 border border-violet-700/40 p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Collect {artist.display_name}'s work on HumanPalette</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">Every artist on HumanPalette is a real human. Download the app to swipe, match, and commission.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={appStoreUrl} className="inline-flex items-center justify-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors">🍎 App Store</a>
            <a href={`humanpalette://artist/${params.handle}`} className="inline-flex items-center justify-center gap-2 bg-violet-700 hover:bg-violet-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors">Open in App</a>
          </div>
        </div>
      </main>
      <footer className="text-center py-8 text-gray-600 text-xs border-t border-white/5"><Link href="/" className="hover:text-violet-400">HumanPalette</Link> · Human-made art only · No AI.</footer>
    </div>
  );
}
