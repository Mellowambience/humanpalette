import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth.store';

export default function ProfileScreen() {
  const router = useRouter();
  const { session, profile, signOut } = useAuthStore();
  const isArtist = profile?.role === 'artist';
  const [artworks, setArtworks] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [stats, setStats] = useState({ sales: 0, earned: 0 });
  const [trustScore, setTrustScore] = useState(100);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'portfolio' | 'stats'>('portfolio');
  const [verifyBanner, setVerifyBanner] = useState(false);

  useEffect(() => { if (!session?.user.id) return; isArtist ? loadArtist() : loadCollector(); }, [session?.user.id]);

  async function loadArtist() {
    setLoading(true);
    const [artRes, txRes, verRes] = await Promise.all([
      supabase.from('artworks').select('id,title,media_url,price_cents,is_human_verified,status').eq('artist_id', session!.user.id).order('created_at', { ascending: false }),
      supabase.from('transactions').select('amount_cents').eq('artist_id', session!.user.id).eq('status', 'completed'),
      supabase.from('artist_profiles').select('is_human_verified').eq('id', session!.user.id).single(),
    ]);
    if (artRes.data) setArtworks(artRes.data);
    if (txRes.data) setStats({ sales: txRes.data.length, earned: txRes.data.reduce((s, t) => s + t.amount_cents, 0) });
    if (verRes.data && !verRes.data.is_human_verified) setVerifyBanner(true);
    setLoading(false);
  }

  async function loadCollector() {
    setLoading(true);
    const [wlRes, colRes] = await Promise.all([
      supabase.from('wishlists').select('id,artwork_id,artworks(title,media_url,price_cents,is_human_verified)').eq('collector_id', session!.user.id),
      supabase.from('collector_profiles').select('trust_score').eq('id', session!.user.id).single(),
    ]);
    if (wlRes.data) setWishlist(wlRes.data as any[]);
    if (colRes.data) setTrustScore(colRes.data.trust_score);
    setLoading(false);
  }

  const trustColor = trustScore >= 70 ? '#4ade80' : trustScore >= 40 ? '#fbbf24' : '#f87171';

  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a' }}><ActivityIndicator color="#a78bfa" /></View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a' }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>{profile?.display_name?.charAt(0)?.toUpperCase() ?? '?'}</Text></View>
        <View style={{ flex: 1 }}><Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{profile?.display_name}</Text><Text style={{ color: '#9ca3af', fontSize: 13 }}>{isArtist ? 'Artist' : 'Collector'}</Text></View>
        <TouchableOpacity onPress={() => Alert.alert('Sign out?', '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', style: 'destructive', onPress: signOut }])}><Text style={{ color: '#6b7280', fontSize: 13 }}>Sign out</Text></TouchableOpacity>
      </View>
      {verifyBanner && isArtist && <View style={{ backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#7c3aed' }}><Text style={{ color: '#a78bfa', fontWeight: '700', fontSize: 14, marginBottom: 4 }}>Get Human Verified</Text><Text style={{ color: '#9ca3af', fontSize: 13 }}>Submit WIP proofs to earn the verified badge and unlock more matches.</Text></View>}
      {!isArtist && <View style={{ backgroundColor: '#1e1e2e', borderRadius: 14, padding: 18, marginBottom: 20, alignItems: 'center' }}><Text style={{ color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>Trust Score</Text><Text style={{ fontSize: 48, fontWeight: '800', color: trustColor }}>{trustScore}</Text></View>}
      {isArtist && (
        <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
          {(['portfolio', 'stats'] as const).map((t) => (<TouchableOpacity key={t} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: tab === t ? '#7c3aed' : '#1e1e2e' }} onPress={() => setTab(t)}><Text style={{ color: tab === t ? '#fff' : '#9ca3af', fontWeight: '600', textTransform: 'capitalize' }}>{t}</Text></TouchableOpacity>))}
        </View>
      )}
      {isArtist && tab === 'portfolio' && (
        <><TouchableOpacity style={{ borderWidth: 1, borderColor: '#7c3aed', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 16 }} onPress={() => router.push('/(app)/upload')}><Text style={{ color: '#a78bfa', fontWeight: '600' }}>+ Upload Artwork</Text></TouchableOpacity>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{artworks.map((art) => (<View key={art.id} style={{ width: '47%' }}><Image source={{ uri: art.media_url }} style={{ width: '100%', aspectRatio: 1, borderRadius: 10 }} />{art.is_human_verified && <View style={{ position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(16,185,129,0.85)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>Verified</Text></View>}<Text style={{ color: '#e2e8f0', fontSize: 13, marginTop: 6, fontWeight: '600' }} numberOfLines={1}>{art.title}</Text><Text style={{ color: '#a78bfa', fontSize: 12 }}>${(art.price_cents / 100).toFixed(0)}</Text></View>))}</View></>
      )}
      {isArtist && tab === 'stats' && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[['Sales', stats.sales], ['Earned', `$${(stats.earned/100).toFixed(0)}`], ['Works', artworks.length]].map(([label, val]: any) => (<View key={label} style={{ flex: 1, backgroundColor: '#1e1e2e', borderRadius: 12, padding: 16, alignItems: 'center' }}><Text style={{ color: '#a78bfa', fontSize: 28, fontWeight: '800' }}>{val}</Text><Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>{label}</Text></View>))}
        </View>
      )}
      {!isArtist && (
        wishlist.length === 0 ? <Text style={{ color: '#555', fontSize: 14, textAlign: 'center', marginTop: 30 }}>Save artworks while browsing to build your wishlist.</Text> :
        wishlist.map((item: any) => (<View key={item.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' }}><Image source={{ uri: item.artworks.media_url }} style={{ width: 64, height: 64, borderRadius: 8 }} /><View style={{ flex: 1 }}><Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: '600' }}>{item.artworks.title}</Text><Text style={{ color: '#a78bfa', fontSize: 13 }}>${(item.artworks.price_cents/100).toFixed(0)}</Text></View></View>))
      )}
    </ScrollView>
  );
}
