import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
}

export function AdminStatsHeader({ stats }: { stats: Stats }) {
  return (
    <View style={styles.container}>
      <StatPill label="Pending" value={stats.pending} color="#f59e0b" />
      <StatPill label="Approved" value={stats.approved} color="#22c55e" />
      <StatPill label="Rejected" value={stats.rejected} color="#ef4444" />
    </View>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.pill, { borderColor: color + '44' }]}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingBottom: 4,
  },
  pill: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
  },
  value: { fontSize: 22, fontWeight: '700' },
  label: { fontSize: 11, color: '#666', fontWeight: '500' },
});
