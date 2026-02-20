// components/CommitmentFeeModal.tsx
// Stripe PaymentSheet for commitment fee on swipe-right
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth.store';

interface Props { visible: boolean; artworkId: string; artistId: string; artworkTitle: string; artworkPrice: number; onClose: () => void; onSuccess: (matchId: string) => void; }

export default function CommitmentFeeModal({ visible, artworkId, artistId, artworkTitle, artworkPrice, onClose, onSuccess }: Props) {
  const { user } = useAuthStore();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const handleCommit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('commitment-create', { body: { artworkId, artistId, collectorId: user.id } });
      if (error) throw error;
      const { clientSecret, matchId } = data;
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'HumanPalette', paymentIntentClientSecret: clientSecret,
        appearance: { colors: { primary: '#ffffff', background: '#0a0a0a', componentBackground: '#141414', componentBorder: '#222', primaryText: '#fff', secondaryText: '#888' } },
      });
      if (initError) throw initError;
      const { error: payError } = await presentPaymentSheet();
      if (payError) { if (payError.code !== 'Canceled') Alert.alert('Payment failed', payError.message); return; }
      onSuccess(matchId);
    } catch (e: any) { Alert.alert('Something went wrong', e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Connect with this artist</Text>
          <Text style={styles.artName}>{artworkTitle}</Text>
          <View style={styles.feeCard}>
            <View style={styles.feeRow}><Text style={styles.feeLabel}>Commitment fee</Text><Text style={styles.feeAmount}>$5.00</Text></View>
            <Text style={styles.feeDesc}>Held while in conversation. Refunded on close, forfeited if you go silent for 7+ days.</Text>
          </View>
          <TouchableOpacity style={[styles.commitBtn, loading && styles.disabled]} onPress={handleCommit} disabled={loading}>
            {loading ? <ActivityIndicator color="#0a0a0a" /> : <Text style={styles.commitBtnText}>Pay $5.00 & Send Request</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelBtnText}>Not right now</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#0e0e0e', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 28, paddingTop: 16, paddingBottom: 48, gap: 16, borderTopWidth: 1, borderColor: '#1a1a1a' },
  handle: { width: 36, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' }, artName: { color: '#666', fontSize: 14 },
  feeCard: { backgroundColor: '#141414', borderWidth: 1, borderColor: '#1e1e1e', borderRadius: 14, padding: 16, gap: 10 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeLabel: { color: '#aaa', fontSize: 15, fontWeight: '500' }, feeAmount: { color: '#fff', fontSize: 22, fontWeight: '800' },
  feeDesc: { color: '#555', fontSize: 13, lineHeight: 19 },
  commitBtn: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  commitBtnText: { color: '#0a0a0a', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.5 }, cancelBtn: { paddingVertical: 12, alignItems: 'center' }, cancelBtnText: { color: '#555', fontSize: 14 },
});
