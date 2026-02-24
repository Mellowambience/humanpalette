import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { QueueCard } from '../../components/admin/QueueCard';
import { AdminStatsHeader } from '../../components/admin/AdminStatsHeader';
import { fetchQueue, approveArtist, rejectArtist, type QueueEntry } from '../../lib/admin';
import { supabase } from '../../lib/supabase';

export default function VerificationQueue() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await fetchQueue();
    setQueue(data);
    setStats({
      pending: data.filter(e => e.status === 'pending').length,
      approved: data.filter(e => e.status === 'approved').length,
      rejected: data.filter(e => e.status === 'rejected').length,
    });
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();

    // Realtime — update queue live when rows change
    const channel = supabase
      .channel('admin:verification_queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verification_queue' }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const handleApprove = useCallback(async (entry: QueueEntry) => {
    Alert.alert(
      'Approve Artist',
      `Grant Human Verified seal to ${entry.artist_name}? This will write an EAS attestation on Base.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve + Attest',
          style: 'default',
          onPress: async () => {
            setProcessingId(entry.id);
            const result = await approveArtist(entry);
            setProcessingId(null);
            if (result.error) {
              Alert.alert('Error', result.error);
            } else {
              Alert.alert('Done', `Attestation UID: ${result.attestation_uid?.slice(0, 12)}...`);
              load();
            }
          },
        },
      ]
    );
  }, [load]);

  const handleReject = useCallback(async (entry: QueueEntry) => {
    Alert.prompt(
      'Reject Artist',
      'Add a note for the artist (optional):',
      async (notes) => {
        setProcessingId(entry.id);
        await rejectArtist(entry, notes ?? '');
        setProcessingId(null);
        load();
      },
      'plain-text'
    );
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#a78bfa" size="large" />
      </View>
    );
  }

  const pending = queue.filter(e => e.status === 'pending');

  return (
    <View style={styles.container}>
      <AdminStatsHeader stats={stats} />

      {pending.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>✦</Text>
          <Text style={styles.emptyTitle}>Queue is clear</Text>
          <Text style={styles.emptySubtitle}>No pending verification requests.</Text>
        </View>
      ) : (
        <FlatList
          data={pending}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <QueueCard
              entry={item}
              isProcessing={processingId === item.id}
              onApprove={() => handleApprove(item)}
              onReject={() => handleReject(item)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor="#a78bfa"
            />
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon: { fontSize: 32, color: '#a78bfa', marginBottom: 4 },
  emptyTitle: { color: '#f5f5f5', fontSize: 18, fontWeight: '600' },
  emptySubtitle: { color: '#888', fontSize: 14 },
});
