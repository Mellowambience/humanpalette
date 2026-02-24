import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';

interface SettingRowProps {
  label: string;
  description?: string;
  value?: string;
  isToggle?: boolean;
  toggled?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  placeholder?: string;
  onChangeText?: (t: string) => void;
}

function SettingRow({ label, description, value, isToggle, toggled, onToggle, onPress, placeholder, onChangeText }: SettingRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description && <Text style={styles.rowDesc}>{description}</Text>}
      </View>
      {isToggle && onToggle !== undefined && (
        <Switch
          value={toggled}
          onValueChange={onToggle}
          trackColor={{ false: '#333', true: '#7c3aed' }}
          thumbColor={toggled ? '#a78bfa' : '#888'}
        />
      )}
      {!isToggle && onChangeText && (
        <TextInput
          style={styles.input}
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#555"
          onChangeText={onChangeText}
          keyboardType="numeric"
        />
      )}
      {!isToggle && !onChangeText && onPress && (
        <TouchableOpacity onPress={onPress}>
          <Text style={styles.rowAction}>{value} ›</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function AdminSettings() {
  const [requireWipProof, setRequireWipProof] = useState(true);
  const [aiScoreThreshold, setAiScoreThreshold] = useState('80');
  const [trustScoreDoubleAt, setTrustScoreDoubleAt] = useState('30');
  const [autoFlagHighAi, setAutoFlagHighAi] = useState(true);
  const [baseSepolia, setBaseSepolia] = useState(false);

  const handleSave = () => {
    Alert.alert(
      'Save Settings',
      'Settings are currently stored locally. To persist across devices, save them to your Supabase `admin_config` table.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>

      <Text style={styles.section}>Verification</Text>
      <SettingRow
        label="Require WIP proof"
        description="Artists must attach process photos or video during application."
        isToggle
        toggled={requireWipProof}
        onToggle={setRequireWipProof}
      />
      <SettingRow
        label="AI score auto-flag threshold"
        description="Applications with AI score above this % are auto-flagged for manual review."
        value={aiScoreThreshold}
        placeholder="80"
        onChangeText={setAiScoreThreshold}
      />
      <SettingRow
        label="Auto-flag high AI score"
        description="Automatically move high-AI-score submissions to the top of the queue."
        isToggle
        toggled={autoFlagHighAi}
        onToggle={setAutoFlagHighAi}
      />

      <Text style={styles.section}>Trust Score</Text>
      <SettingRow
        label="Commitment fee doubles at"
        description="Collector Trust Score threshold below which the commitment fee is doubled."
        value={trustScoreDoubleAt}
        placeholder="30"
        onChangeText={setTrustScoreDoubleAt}
      />

      <Text style={styles.section}>EAS Attestation</Text>
      <SettingRow
        label="Use Base Sepolia (testnet)"
        description="Write attestations to Base Sepolia instead of mainnet. Disable for production."
        isToggle
        toggled={baseSepolia}
        onToggle={setBaseSepolia}
      />
      <SettingRow
        label="EAS contract"
        description="Base mainnet EAS contract address."
        value="0xC2679fBD37d54388Ce493F1DB75320D236e1815e"
        onPress={() => {}}
      />
      <SettingRow
        label="EAS explorer"
        description="Attestations are viewable at:"
        value="base.easscan.org"
        onPress={() => {}}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Save Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  section: {
    color: '#a78bfa',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  rowLeft: { flex: 1, paddingRight: 12 },
  rowLabel: { color: '#f5f5f5', fontSize: 15 },
  rowDesc: { color: '#666', fontSize: 12, marginTop: 2, lineHeight: 16 },
  rowAction: { color: '#a78bfa', fontSize: 15 },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: 72,
    textAlign: 'right',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  saveBtn: {
    marginHorizontal: 16,
    marginTop: 32,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
