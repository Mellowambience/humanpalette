// app/(auth)/role-select.tsx
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore, UserRole } from '../../store/auth.store';

export default function RoleSelectScreen() {
  const params = useLocalSearchParams<{ email: string; password: string; displayName: string }>();
  const { signUpWithEmail, isLoading } = useAuthStore();

  const handleSelect = async (role: UserRole) => {
    try {
      await signUpWithEmail(params.email, params.password, role, params.displayName);
      router.replace(role === 'artist' ? '/(auth)/artist-verify' : '/(app)/discover');
    } catch (e: any) { Alert.alert('Sign up failed', e.message); }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Who are you?</Text>
      <Text style={styles.subtitle}>This shapes your entire experience on HumanPalette.</Text>
      <View style={styles.cards}>
        <TouchableOpacity style={styles.roleCard} onPress={() => handleSelect('artist')} disabled={isLoading}>
          <Text style={styles.roleIcon}>🎨</Text>
          <Text style={styles.roleTitle}>Artist</Text>
          <Text style={styles.roleDesc}>Show your work. Earn from sales and commissions. Get verified with the Human seal.</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.roleCard} onPress={() => handleSelect('collector')} disabled={isLoading}>
          <Text style={styles.roleIcon}>🖼️</Text>
          <Text style={styles.roleTitle}>Collector</Text>
          <Text style={styles.roleDesc}>Discover and buy art made by real humans. Commission directly.</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 28, paddingTop: 60, paddingBottom: 48 },
  back: { marginBottom: 32 },
  backText: { color: '#888', fontSize: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 36 },
  cards: { gap: 16 },
  roleCard: { backgroundColor: '#141414', borderWidth: 1, borderColor: '#222', borderRadius: 18, padding: 24, gap: 10 },
  roleIcon: { fontSize: 32 },
  roleTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  roleDesc: { fontSize: 14, color: '#888', lineHeight: 20 },
});
