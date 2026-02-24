import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth.store';

type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type Match = {
  id: string;
  artist_id: string;
  collector_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'ghosted';
  artwork_id: string;
  artworks: { title: string };
  artist_profile: { display_name: string };
  collector_profile: { display_name: string };
};

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const { session, profile } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [match, setMatch] = useState<Match | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const isArtist = profile?.role === 'artist';

  useEffect(() => {
    if (!matchId) return;
    loadMatch();
    loadMessages();
    subscribeToMessages();
  }, [matchId]);

  async function loadMatch() {
    const { data } = await supabase
      .from('matches')
      .select(`*, artworks(title), artist_profile:profiles!matches_artist_id_fkey(display_name), collector_profile:profiles!matches_collector_id_fkey(display_name)`)
      .eq('id', matchId)
      .single();
    if (data) setMatch(data as Match);
  }

  async function loadMessages() {
    setLoading(true);
    const { data } = await supabase.from('messages').select('*').eq('match_id', matchId).order('created_at', { ascending: true });
    if (data) setMessages(data);
    setLoading(false);
  }

  function subscribeToMessages() {
    const channel = supabase.channel(`match-${matchId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` }, (payload) => {
      setMessages((prev) => [...prev, payload.new as Message]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }).subscribe();
    return () => supabase.removeChannel(channel);
  }

  async function handleAccept() {
    const { error } = await supabase.from('matches').update({ status: 'accepted' }).eq('id', matchId);
    if (!error) setMatch((prev) => prev ? { ...prev, status: 'accepted' } : prev);
  }

  async function handleDecline() {
    Alert.alert('Decline request?', 'The collector will be notified.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: async () => { await supabase.from('matches').update({ status: 'declined' }).eq('id', matchId); router.back(); } },
    ]);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || !session?.user.id) return;
    setInput('');
    await supabase.from('messages').insert({ match_id: matchId, sender_id: session.user.id, content: text });
  }

  const otherName = isArtist ? match?.collector_profile?.display_name : match?.artist_profile?.display_name;
  const chatLocked = match?.status === 'pending' && isArtist;

  return (
    <>
      <Stack.Screen options={{ title: otherName ?? 'Chat', headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#fff' }} />
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0a0a0a' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        {chatLocked && (
          <View style={{ backgroundColor: '#1a1a2e', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2d2d4e' }}>
            <Text style={{ color: '#e2e8f0', fontSize: 14, marginBottom: 12 }}>💌 {match?.collector_profile?.display_name} wants to discuss "{match?.artworks?.title}"</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={{ flex: 1, borderWidth: 1, borderColor: '#4a4a6a', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }} onPress={handleDecline}><Text style={{ color: '#9ca3af' }}>Decline</Text></TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#a78bfa', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }} onPress={handleAccept}><Text style={{ color: '#fff', fontWeight: '700' }}>Accept</Text></TouchableOpacity>
            </View>
          </View>
        )}
        {loading ? <ActivityIndicator style={{ flex: 1 }} color="#a78bfa" /> : (
          <FlatList ref={flatListRef} data={messages} keyExtractor={(item) => item.id} contentContainerStyle={{ padding: 16 }} onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })} renderItem={({ item }) => {
            const isMine = item.sender_id === session?.user.id;
            return (<View style={{ maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 8, alignSelf: isMine ? 'flex-end' : 'flex-start', backgroundColor: isMine ? '#7c3aed' : '#1e1e2e' }}><Text style={{ fontSize: 15, color: '#fff' }}>{item.content}</Text></View>);
          }} />
        )}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1e1e2e', gap: 8 }}>
          <TextInput style={{ flex: 1, backgroundColor: '#1e1e2e', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#e2e8f0', fontSize: 15 }} value={input} onChangeText={setInput} placeholder="Type a message..." placeholderTextColor="#666" editable={!chatLocked} multiline onSubmitEditing={sendMessage} />
          <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center', opacity: chatLocked || !input.trim() ? 0.4 : 1 }} onPress={sendMessage} disabled={chatLocked || !input.trim()}><Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>↑</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
