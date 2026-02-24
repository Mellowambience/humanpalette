import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

type Props = { score: number | null; compact?: boolean };

function getScoreLabel(score: number): { label: string; color: string; bg: string } {
  if (score <= 15) return { label: 'Likely Human', color: '#4ade80', bg: 'rgba(16,185,129,0.12)' };
  if (score <= 45) return { label: 'Uncertain',    color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' };
  return              { label: 'AI Likely',        color: '#f87171', bg: 'rgba(248,113,113,0.12)' };
}

export function AIScoreBadge({ score, compact = false }: Props) {
  if (score === null || score === undefined) return compact ? null : (
    <View style={[styles.badge, { backgroundColor: 'rgba(107,114,128,0.12)' }]}>
      <Text style={[styles.dot, { color: '#6b7280' }]}>●</Text>
      <Text style={[styles.label, { color: '#6b7280' }]}>Not scored</Text>
    </View>
  );

  const { label, color, bg } = getScoreLabel(score);
  const openExplainer = () => Linking.openURL('https://humanpalette.app/how-it-works#ai-score');

  if (compact) return (
    <TouchableOpacity onPress={openExplainer} style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.dot, { color }]}>●</Text>
      <Text style={[styles.label, { color }]}>{score}</Text>
    </TouchableOpacity>
  );

  return (
    <TouchableOpacity onPress={openExplainer} style={[styles.fullBadge, { backgroundColor: bg }]}>
      <View style={styles.row}>
        <Text style={[styles.dot, { color }]}>●</Text>
        <Text style={[styles.fullLabel, { color }]}>{label}</Text>
        <Text style={[styles.score, { color }]}>{score}/100</Text>
      </View>
      <Text style={styles.hint}>AI detection score · tap to learn more</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, gap: 4 },
  dot: { fontSize: 8 },
  label: { fontSize: 11, fontWeight: '700' },
  fullBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fullLabel: { fontSize: 13, fontWeight: '700', flex: 1 },
  score: { fontSize: 13, fontWeight: '800' },
  hint: { color: '#6b7280', fontSize: 11, marginTop: 3 },
});
