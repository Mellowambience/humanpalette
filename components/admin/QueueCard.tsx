import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
} from 'react-native';
import type { QueueEntry } from '../../lib/admin';

interface QueueCardProps {
  entry: QueueEntry;
  isProcessing: boolean;
  onApprove: () => void;
  onReject: () => void;
}

const AI_SCORE_COLOR = (score: number | null) => {
  if (score === null) return '#888';
  if (score >= 80) return '#ef4444';
  if (score >= 50) return '#f59e0b';
  return '#22c55e';
};

export function QueueCard({ entry, isProcessing, onApprove, onReject }: QueueCardProps) {
  const hasProofMedia = entry.proof_urls && entry.proof_urls.length > 0;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        {entry.avatar_url ? (
          <Image source={{ uri: entry.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>{entry.artist_name?.[0] ?? '?'}</Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{entry.artist_name ?? 'Unknown artist'}</Text>
          {entry.username && <Text style={styles.handle}>@{entry.username}</Text>}
          <Text style={styles.submitted}>
            Submitted {new Date(entry.submitted_at).toLocaleDateString()}
          </Text>
        </View>
        {entry.ai_score !== null && (
          <View style={[styles.aiScore, { borderColor: AI_SCORE_COLOR(entry.ai_score) }]}>
            <Text style={[styles.aiScoreLabel, { color: AI_SCORE_COLOR(entry.ai_score) }]}>
              AI
            </Text>
            <Text style={[styles.aiScoreValue, { color: AI_SCORE_COLOR(entry.ai_score) }]}>
              {entry.ai_score}%
            </Text>
          </View>
        )}
      </View>

      {/* Bio */}
      {entry.bio && (
        <Text style={styles.bio} numberOfLines={3}>{entry.bio}</Text>
      )}

      {/* Proof media strip */}
      {hasProofMedia && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.proofStrip}>
          {entry.proof_urls!.map((url, i) => (
            <TouchableOpacity key={i} onPress={() => Linking.openURL(url)}>
              <Image source={{ uri: url }} style={styles.proofThumb} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Notes */}
      {entry.notes && (
        <View style={styles.noteBox}>
          <Text style={styles.noteLabel}>Application note</Text>
          <Text style={styles.noteText}>{entry.notes}</Text>
        </View>
      )}

      {/* Wallet */}
      {entry.wallet_address && (
        <Text style={styles.wallet}>
          Wallet: {entry.wallet_address.slice(0, 10)}...{entry.wallet_address.slice(-6)}
        </Text>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.rejectBtn, isProcessing && styles.btnDisabled]}
          onPress={onReject}
          disabled={isProcessing}
        >
          <Text style={styles.rejectBtnText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.approveBtn, isProcessing && styles.btnDisabled]}
          onPress={onApprove}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.approveBtnText}>✦ Approve + Attest</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: { backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#a78bfa', fontSize: 22, fontWeight: '700' },
  headerInfo: { flex: 1 },
  name: { color: '#f5f5f5', fontSize: 16, fontWeight: '600', marginBottom: 2 },
  handle: { color: '#888', fontSize: 13 },
  submitted: { color: '#555', fontSize: 11, marginTop: 2 },
  aiScore: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  aiScoreLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  aiScoreValue: { fontSize: 14, fontWeight: '700' },
  bio: { color: '#aaa', fontSize: 14, lineHeight: 20, marginBottom: 10 },
  proofStrip: { marginBottom: 12 },
  proofThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#222',
  },
  noteBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  noteLabel: { color: '#666', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  noteText: { color: '#ccc', fontSize: 13, lineHeight: 18 },
  wallet: { color: '#555', fontSize: 11, fontFamily: 'monospace', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  rejectBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
  },
  rejectBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
  approveBtn: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
  },
  approveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.4 },
});
