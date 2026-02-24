import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Switch, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth.store';
import { decode } from 'base64-arraybuffer';

type UseType = 'personal' | 'display' | 'commercial';
const USE_TYPE_LABELS: Record<UseType, string> = { personal: 'Personal Enjoyment', display: 'Public Display', commercial: 'Commercial / Resale' };

export default function UploadScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [tags, setTags] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaBase64, setMediaBase64] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [wipsUri, setWipsUri] = useState<string[]>([]);
  const [allowsCommercial, setAllowsCommercial] = useState(false);
  const [commercialMultiplier, setCommercialMultiplier] = useState('1.25');
  const [availableUseTypes, setAvailableUseTypes] = useState<UseType[]>(['personal', 'display']);
  const [uploading, setUploading] = useState(false);

  async function pickMedia() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, allowsEditing: true, quality: 0.9, base64: true });
    if (!result.canceled && result.assets[0]) { setMediaUri(result.assets[0].uri); setMediaBase64(result.assets[0].base64 ?? null); setMediaType(result.assets[0].type === 'video' ? 'video' : 'image'); }
  }

  async function pickWipProof() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, allowsMultipleSelection: true, quality: 0.8 });
    if (!result.canceled) setWipsUri((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
  }

  function toggleUseType(ut: UseType) { setAvailableUseTypes((prev) => prev.includes(ut) ? prev.filter((x) => x !== ut) : [...prev, ut]); }

  async function handleUpload() {
    if (!title.trim() || !price || !mediaBase64 || !session?.user.id) { Alert.alert('Missing info', 'Please add a title, price, and artwork image.'); return; }
    setUploading(true);
    try {
      const ext = mediaType === 'video' ? 'mp4' : 'jpg';
      const fileName = `${session.user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('artworks').upload(fileName, decode(mediaBase64), { contentType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg' });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('artworks').getPublicUrl(fileName);
      const { error: insertErr } = await supabase.from('artworks').insert({ artist_id: session.user.id, title: title.trim(), description: description.trim() || null, price_cents: Math.round(parseFloat(price) * 100), media_url: urlData.publicUrl, media_type: mediaType, tags: tags.split(',').map((t) => t.trim()).filter(Boolean), allows_commercial: allowsCommercial, commercial_rate_multiplier: allowsCommercial ? parseFloat(commercialMultiplier) : 1.0, available_use_types: availableUseTypes, status: 'listed' });
      if (insertErr) throw insertErr;
      Alert.alert('Uploaded!', 'Your artwork is live.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) { Alert.alert('Upload failed', err.message ?? 'Unknown error'); }
    finally { setUploading(false); }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a' }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 20 }}>Upload Artwork</Text>
      <TouchableOpacity style={{ width: '100%', height: 220, borderRadius: 16, overflow: 'hidden', backgroundColor: '#1e1e2e', marginBottom: 20, alignItems: 'center', justifyContent: 'center' }} onPress={pickMedia}>
        {mediaUri ? <Image source={{ uri: mediaUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Text style={{ color: '#666', fontSize: 14 }}>Tap to add artwork image or video</Text>}
      </TouchableOpacity>
      {[['Title *', title, setTitle, 'e.g. Crimson Drift No. 4', false], ['Price (USD) *', price, setPrice, '250.00', true], ['Tags (comma-separated)', tags, setTags, 'oil, portrait, abstract', false]].map(([label, val, setter, ph, numeric]: any) => (<View key={label}><Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 16 }}>{label}</Text><TextInput style={{ backgroundColor: '#1e1e2e', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#e2e8f0', fontSize: 15, borderWidth: 1, borderColor: '#2d2d4e' }} value={val} onChangeText={setter} placeholder={ph} placeholderTextColor="#555" keyboardType={numeric ? 'decimal-pad' : 'default'} /></View>))}
      <Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 16 }}>Description</Text>
      <TextInput style={{ backgroundColor: '#1e1e2e', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#e2e8f0', fontSize: 15, borderWidth: 1, borderColor: '#2d2d4e', minHeight: 90, textAlignVertical: 'top' }} value={description} onChangeText={setDescription} placeholder="Tell the story behind this piece..." placeholderTextColor="#555" multiline />
      <Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: '600', marginBottom: 4, marginTop: 16 }}>WIP Proofs</Text>
      <Text style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>Required for Human Verified badge.</Text>
      <TouchableOpacity style={{ borderWidth: 1, borderColor: '#4a4a6a', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }} onPress={pickWipProof}><Text style={{ color: '#a78bfa', fontWeight: '600' }}>+ Add WIP photos/videos</Text></TouchableOpacity>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}><View style={{ flex: 1 }}><Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: '600' }}>Allow Commercial Use</Text><Text style={{ color: '#666', fontSize: 12, marginTop: 2 }}>Collectors can license commercially.</Text></View><Switch value={allowsCommercial} onValueChange={setAllowsCommercial} trackColor={{ true: '#7c3aed', false: '#333' }} thumbColor={allowsCommercial ? '#a78bfa' : '#888'} /></View>
      <Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 16 }}>Use Types Available</Text>
      {(['personal', 'display', 'commercial'] as UseType[]).map((ut) => (<TouchableOpacity key={ut} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 }} onPress={() => toggleUseType(ut)}><View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: availableUseTypes.includes(ut) ? '#7c3aed' : '#4a4a6a', backgroundColor: availableUseTypes.includes(ut) ? '#7c3aed' : 'transparent' }} /><Text style={{ color: '#e2e8f0', fontSize: 14 }}>{USE_TYPE_LABELS[ut]}</Text></TouchableOpacity>))}
      <TouchableOpacity style={{ backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 32, opacity: uploading ? 0.6 : 1 }} onPress={handleUpload} disabled={uploading}>
        {uploading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Publish Artwork</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}
