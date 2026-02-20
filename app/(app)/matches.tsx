// app/(app)/matches.tsx
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth.store';

export default function MatchesScreen() {
  const { user, profile } = useAuthStore();
  const { data: matches = [], isLoading, refetch } = useQuery({
    queryKey: ['matches', user?.id],
    queryFn: async () => {
      const filterCol = profile?.role === 'artist' ? 'artist_id' : 'collector_id';
      const { data, error } = await supabase.from('matches')
        .select('id, status, created_at, artwork:artworks!artwork_id(id,title,media_urls,price), artist:profiles!artist_id(id,display_name,avatar_url), collector:profiles!collector_id(id,display_name,avatar_url)')
        .eq(filterCol, user!.id).in('status', ['active', 'pending']).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!profile,
    refetchInterval: 15000,
  });

  if (isLoading) return <View style={styles.centered}><ActivityIndicator color="#fff" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Matches</Text></View>
      {matches.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyTitle}>No matches yet</Text></View>
      ) : (
        <FlatList data={matches as any[]} keyExtractor={(m: any) => m.id}
          renderItem={({ item }: any) => (
            <TouchableOpacity style={styles.row} onPress={() => router.push({ pathname: '/(app)/chat', params: { matchId: item.id } })}>
              <View style={styles.artThumb} />
              <View style={styles.rowContent}>
                <Text style={styles.name}>{profile?.role === 'artist' ? item.collector?.display_name : item.artist?.display_name}</Text>
                <Text style={styles.preview}>{item.artwork?.title ?? 'New match'}</Text>
              </View>
            </TouchableOpacity>
          )}
          onRefresh={refetch} refreshing={isLoading}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  centered: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  row: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 14, gap: 14 },
  artThumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#1a1a1a' },
  rowContent: { flex: 1, justifyContent: 'center', gap: 4 },
  name: { color: '#fff', fontSize: 15, fontWeight: '600' },
  preview: { color: '#555', fontSize: 13 },
});
