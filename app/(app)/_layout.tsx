// app/(app)/_layout.tsx — tab navigation shell
import { Tabs, Redirect } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { Text } from 'react-native';

export default function AppLayout() {
  const { session, profile } = useAuthStore();
  if (!session || !profile) return <Redirect href="/(auth)/welcome" />;
  const isArtist = profile.role === 'artist';
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#0a0a0a', borderTopColor: '#181818', paddingBottom: 8, height: 72 },
      tabBarActiveTintColor: '#ffffff',
      tabBarInactiveTintColor: '#444444',
      tabBarLabelStyle: { fontSize: 11, marginTop: 2 },
    }}>
      <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>✦</Text> }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💬</Text> }} />
      {isArtist && <Tabs.Screen name="upload" options={{ title: 'Upload', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>+</Text> }} />}
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>◎</Text> }} />
    </Tabs>
  );
}
