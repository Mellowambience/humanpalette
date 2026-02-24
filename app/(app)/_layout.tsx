import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function AppLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: '#0a0a0a', borderTopColor: '#1e1e2e', borderTopWidth: 1 }, tabBarActiveTintColor: '#a78bfa', tabBarInactiveTintColor: '#555', tabBarLabelStyle: { fontSize: 11, fontWeight: '600' } }}>
      <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🔍</Text> }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>💬</Text> }} />
      <Tabs.Screen name="upload" options={{ title: 'Upload', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>＋</Text> }} />
      <Tabs.Screen name="events" options={{ title: 'Events', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🎭</Text> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👤</Text> }} />
      <Tabs.Screen name="chat" options={{ href: null }} />
      <Tabs.Screen name="checkout" options={{ href: null }} />
      <Tabs.Screen name="stripe-onboard" options={{ href: null }} />
      <Tabs.Screen name="gallery-room" options={{ href: null }} />
    </Tabs>
  );
}
