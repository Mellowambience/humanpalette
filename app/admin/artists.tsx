import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
  Linking,
  RefreshControl,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { revokeAttestation, type VerifiedArtist } from '../../lib/admin';

export default function VerifiedArtists() {
  const [artists, setArtists] = useState<VerifiedArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('verified_artists')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setArtists(data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRevoke = useCallback(async (artist: VerifiedArtist) => {
    Alert.alert(
      'Revoke Attestation',
      `Remove Human Verified seal from ${artist.display_name}? This revokes the on-chain EAS attestation.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            setRevoking(artist.id);
            const result = await revokeAttestation(artist);
            setRevoking(null);
            if (result.error) {
              Alert.alert('Error', result.error);
            } else {
              Alert.alert('Revoked', 'Attestation revoked on-chain.');
              load();
            }
          },
        },
      ]
    );
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#a78bfa" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.count}>{artists.length} verified artist{artists.length !== 1 ? 's' : ''}</Text>
      <FlatList
        data={artists}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>{item.display_name?.[0] ?? '?'}</Text>
                </View>
              )}
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.display_name}</Text>
                  <Text style={styles.seal}>✦ Verified</Text>
                </View>
                <Text style={styles.handle}>@{item.username}</Text>
                {item.wallet_address && (
                  <Text style={styles.wallet} numberOfLines={1}>
                    {item.wallet_address.slice(0, 8)}...{item.wallet_address.slice(-6)}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.actions}>
              {item.attestation_url && (
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => Linking.openURL(item.attestation_url!)}
                >
                  <Text style={styles.viewBtnText}>View on EAS ↗</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.revokeBtn, revoking === item.id && styles.btnDisabled]}
                onPress={() => handleRevoke(item)}
                disabled={revoking === item.id}
              >
                {revoking === item.id ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Text style={styles.revokeBtnText}>Revoke</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor="#a78bfa"
          />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No verified artists yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  count: { color: '#888', fontSize: 13, paddingHorizontal: 16, paddingVertical: 12 },
  card: {
    backgroundColor: '#111',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#a78bfa', fontSize: 20, fontWeight: '700' },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: '#f5f5f5', fontSize: 16, fontWeight: '600' },
  seal: { color: '#a78bfa', fontSize: 11, fontWeight: '600' },
  handle: { color: '#888', fontSize: 13 },
  wallet: { color: '#555', fontSize: 11, fontFamily: 'monospace' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14, justifyContent: 'flex-end' },
  viewBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a78bfa',
  },
  viewBtnText: { color: '#a78bfa', fontSize: 13, fontWeight: '500' },
  revokeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  revokeBtnText: { color: '#ef4444', fontSize: 13, fontWeight: '500' },
  btnDisabled: { opacity: 0.4 },
  emptyText: { color: '#888', fontSize: 14 },
});
