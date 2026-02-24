import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth.store';

type UseType = 'personal' | 'display' | 'commercial';
const USE_LABELS: Record<UseType, { label: string; desc: string; icon: string }> = {
  personal: { label: 'Personal', desc: 'For private enjoyment only', icon: '🏠' },
  display: { label: 'Display', desc: 'Gallery walls, public exhibitions', icon: '🖼' },
  commercial: { label: 'Commercial', desc: 'Products, advertising, resale', icon: '💼' },
};

export default function CheckoutScreen() {
  const { artworkId, matchId } = useLocalSearchParams<{ artworkId: string; matchId: string }>();
  const router = useRouter();
  const { session } = useAuthStore();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [useType, setUseType] = useState<UseType>('personal');
  const [loading, setLoading] = useState(false);
  const [artwork, setArtwork] = useState<any>(null);

  React.useEffect(() => { loadArtwork(); }, [artworkId]);

  async function loadArtwork() {
    const { data } = await supabase.from('artworks').select('*, artist_profiles(commercial_rate_multiplier, display_name)').eq('id', artworkId).single();
    if (data) setArtwork(data);
  }

  const basePrice = artwork ? artwork.price_cents / 100 : 0;
  const mult = artwork?.artist_profiles?.commercial_rate_multiplier ?? 1.25;
  const total = useType === 'commercial' ? basePrice * mult : basePrice;
  const uplift = useType === 'commercial' ? basePrice * (mult - 1) : 0;

  async function handlePay() {
    if (!session?.user.id || !artwork) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('purchase-create', { body: { artwork_id: artworkId, match_id: matchId, use_type: useType } });
      if (error) throw error;
      const { error: initErr } = await initPaymentSheet({ merchantDisplayName: 'HumanPalette', paymentIntentClientSecret: data.client_secret, applePay: { merchantCountryCode: 'US' }, googlePay: { merchantCountryCode: 'US', testEnv: true } });
      if (initErr) throw initErr;
      const { error: presentErr } = await presentPaymentSheet();
      if (presentErr) { if (presentErr.code !== 'Canceled') Alert.alert('Payment failed', presentErr.message); return; }
      Alert.alert('Purchase complete!', `You own "${artwork.title}". The artist will be notified.`, [{ text: 'Done', onPress: () => router.replace('/(app)/matches') }]);
    } catch (err: any) { Alert.alert('Error', err.message ?? 'Something went wrong'); }
    finally { setLoading(false); }
  }

  if (!artwork) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a' }}><ActivityIndicator color="#a78bfa" /></View>;

  return (
    <>
      <Stack.Screen options={{ title: 'Checkout', headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#fff' }} />
      <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a' }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 }}>{artwork.title}</Text>
        <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>by {artwork.artist_profiles?.display_name}</Text>
        <Text style={{ color: '#e2e8f0', fontSize: 15, fontWeight: '600', marginBottom: 12 }}>How will you use this artwork?</Text>
        {(['personal', 'display', 'commercial'] as UseType[]).map((ut) => (
          <TouchableOpacity key={ut} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e1e2e', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: useType === ut ? '#7c3aed' : 'transparent', gap: 12 }} onPress={() => setUseType(ut)}>
            <Text style={{ fontSize: 22 }}>{USE_LABELS[ut].icon}</Text>
            <View style={{ flex: 1 }}><Text style={{ color: '#e2e8f0', fontWeight: '600', fontSize: 14 }}>{USE_LABELS[ut].label}</Text><Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{USE_LABELS[ut].desc}</Text></View>
            <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: useType === ut ? '#7c3aed' : '#4a4a6a', backgroundColor: useType === ut ? '#7c3aed' : 'transparent' }} />
          </TouchableOpacity>
        ))}
        <View style={{ backgroundColor: '#1e1e2e', borderRadius: 12, padding: 16, marginTop: 20, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: '#9ca3af', fontSize: 14 }}>Base price</Text><Text style={{ color: '#e2e8f0', fontSize: 14 }}>${basePrice.toFixed(2)}</Text></View>
          {useType === 'commercial' && uplift > 0 && <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: '#9ca3af', fontSize: 14 }}>Commercial uplift</Text><Text style={{ color: '#e2e8f0', fontSize: 14 }}>+${uplift.toFixed(2)}</Text></View>}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#2d2d4e', paddingTop: 10, marginTop: 4 }}><Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Total</Text><Text style={{ color: '#a78bfa', fontWeight: '800', fontSize: 18 }}>${total.toFixed(2)}</Text></View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, backgroundColor: '#0f2027', borderRadius: 10, padding: 12, marginTop: 14, alignItems: 'flex-start' }}><Text style={{ fontSize: 16 }}>🔒</Text><Text style={{ color: '#6b7280', fontSize: 12, flex: 1 }}>Payment held in escrow until artist confirms delivery. 7.5% platform fee applies.</Text></View>
        <TouchableOpacity style={{ backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24, opacity: loading ? 0.6 : 1 }} onPress={handlePay} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Pay ${total.toFixed(2)}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}
