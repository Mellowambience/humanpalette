// app/(auth)/welcome.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.hero}>
        <Text style={styles.logo}>HumanPalette</Text>
        <Text style={styles.tagline}>Art made by humans.{String.fromCharCode(10)}Discovered by humans.</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(auth)/signup')}>
          <Text style={styles.primaryBtnText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.secondaryBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.legal}>By continuing, you agree to our Terms of Service and Privacy Policy.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 28, justifyContent: 'space-between', paddingTop: 100, paddingBottom: 48 },
  hero: { alignItems: 'center', gap: 16 },
  logo: { fontSize: 36, fontWeight: '700', color: '#ffffff', letterSpacing: -1 },
  tagline: { fontSize: 18, color: '#a0a0a0', textAlign: 'center', lineHeight: 26 },
  actions: { gap: 12 },
  primaryBtn: { backgroundColor: '#ffffff', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { color: '#0a0a0a', fontSize: 16, fontWeight: '600' },
  secondaryBtn: { borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  secondaryBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '500' },
  legal: { color: '#444', fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
