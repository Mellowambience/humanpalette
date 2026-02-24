import { Tabs } from 'expo-router';
import { Shield, Users, Settings } from 'lucide-react-native';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a0a' },
        headerTintColor: '#f5f5f5',
        tabBarStyle: { backgroundColor: '#0a0a0a', borderTopColor: '#222' },
        tabBarActiveTintColor: '#a78bfa',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Queue',
          tabBarIcon: ({ color, size }) => <Shield color={color} size={size} />,
          headerTitle: 'Verification Queue',
        }}
      />
      <Tabs.Screen
        name="artists"
        options={{
          title: 'Artists',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          headerTitle: 'Verified Artists',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
          headerTitle: 'Admin Settings',
        }}
      />
    </Tabs>
  );
}
