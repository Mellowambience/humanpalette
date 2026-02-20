// app/(app)/discover.tsx — swipe discovery feed
// See full source at https://github.com/Mellowambience/humanpalette
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth.store';
import ArtworkCard from '../../components/ArtworkCard';
import SwipeActions from '../../components/SwipeActions';

async function fetchDiscoverFeed(userId: string) {
  const { data: swipedIds } = await supabase.from('swipes').select('artwork_id').eq('collector_id', userId);
  const excludeIds = (swipedIds ?? []).map((s: any) => s.artwork_id).filter(Boolean);
  let query = supabase.from('artworks').select(`
    id, title, description, media_urls, price, allows_commercial, artist_id,
    artist:profiles!artist_id (display_name, avatar_url, artist_profiles (human_verified_badge, verification_status))
  `).eq('status', 'active').limit(20);
  if (excludeIds.length > 0) query = query.not('id', 'in', \`(\${excludeIds.join(',')})\`);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export default function DiscoverScreen() {
  const { user } = useAuthStore();
  const swiperRef = useRef<any>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const { data: artworks = [], isLoading, refetch } = useQuery({
    queryKey: ['discover', user?.id],
    queryFn: () => fetchDiscoverFeed(user!.id),
    enabled: !!user,
  });

  const recordSwipe = async (artworkId: string, action: 'like' | 'pass') => {
    if (!user) return;
    await supabase.from('swipes').upsert({ collector_id: user.id, artwork_id: artworkId, artist_id: (artworks as any[]).find((a: any) => a.id === artworkId)?.artist_id, action });
  };

  if (isLoading) return <View style={styles.centered}><ActivityIndicator color="#fff" size="large" /></View>;
  if (artworks.length === 0) return <View style={styles.centered}><Text style={styles.emptyTitle}>You've seen it all</Text><Text style={styles.emptySub}>Check back soon.</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.logo}>HumanPalette</Text></View>
      <Swiper ref={swiperRef} cards={artworks as any[]} cardIndex={cardIndex}
        renderCard={(artwork: any) => artwork ? <ArtworkCard artwork={artwork} /> : null}
        onSwipedLeft={(i) => { recordSwipe((artworks as any[])[i]?.id, 'pass'); setCardIndex(i + 1); }}
        onSwipedRight={(i) => { recordSwipe((artworks as any[])[i]?.id, 'like'); setCardIndex(i + 1); }}
        onSwipedAll={() => refetch()}
        backgroundColor="transparent" stackSize={3} stackScale={8} stackSeparation={18}
        disableBottomSwipe disableTopSwipe animateCardOpacity
        containerStyle={styles.swiperContainer} cardStyle={styles.card}
      />
      <SwipeActions onPass={() => swiperRef.current?.swipeLeft()} onLike={() => swiperRef.current?.swipeRight()} onSuperLike={() => swiperRef.current?.swipeTop()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  centered: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 12 },
  logo: { color: '#fff', fontSize: 20, fontWeight: '700' },
  swiperContainer: { flex: 1 },
  card: { borderRadius: 20, overflow: 'hidden' },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  emptySub: { color: '#666', fontSize: 14 },
});
