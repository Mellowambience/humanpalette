// app/index.tsx
import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/auth.store';

export default function Index() {
  const { session, profile } = useAuthStore();
  if (!session) return <Redirect href="/(auth)/welcome" />;
  if (!profile) return <Redirect href="/(auth)/onboarding" />;
  return <Redirect href="/(app)/discover" />;
}
