// components/SwipeActions.tsx
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
interface Props { onPass: () => void; onLike: () => void; onSuperLike: () => void; }
export default function SwipeActions({ onPass, onLike, onSuperLike }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.btn, styles.passBtn]} onPress={onPass}><Text style={styles.passIcon}>✕</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.superBtn]} onPress={onSuperLike}><Text style={styles.superIcon}>★</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.likeBtn]} onPress={onLike}><Text style={styles.likeIcon}>♥</Text></TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, paddingVertical: 20, paddingBottom: 32 },
  btn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  passBtn: { borderColor: '#333' }, superBtn: { width: 48, height: 48, borderRadius: 24, borderColor: '#2a2a2a' }, likeBtn: { borderColor: '#333' },
  passIcon: { color: '#888', fontSize: 18, fontWeight: '700' },
  superIcon: { color: '#666', fontSize: 16 },
  likeIcon: { color: '#e05', fontSize: 20 },
});
