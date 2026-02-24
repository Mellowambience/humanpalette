import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { usePushNotifications } from '../hooks/usePushNotifications';

const STRIPE_PK = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
const MERCHANT_ID = process.env.EXPO_PUBLIC_APPLE_MERCHANT_ID ?? '';

function RootContent() {
  const { init } = useAuthStore();
  usePushNotifications();
  useEffect(() => { init(); }, []);
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StripeProvider publishableKey={STRIPE_PK} merchantIdentifier={MERCHANT_ID} urlScheme="humanpalette">
        <RootContent />
      </StripeProvider>
    </GestureHandlerRootView>
  );
}
