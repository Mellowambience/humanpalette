import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth.store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true }),
});

export function usePushNotifications() {
  const { session } = useAuthStore();
  const notifListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (!session?.user.id) return;
    registerForPushNotifications(session.user.id);

    notifListener.current = Notifications.addNotificationReceivedListener((n) => console.log('Notification:', n));
    responseListener.current = Notifications.addNotificationResponseReceivedListener((r) => {
      const data = r.notification.request.content.data as Record<string, string>;
      console.log('Notification tapped:', data);
      // TODO: router.push based on data.type / data.match_id
    });

    return () => { notifListener.current?.remove(); responseListener.current?.remove(); };
  }, [session?.user.id]);
}

async function registerForPushNotifications(userId: string) {
  if (!Device.isDevice) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'HumanPalette', importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250], lightColor: '#7c3aed', sound: 'default',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') { const { status } = await Notifications.requestPermissionsAsync(); finalStatus = status; }
  if (finalStatus !== 'granted') return;

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: process.env.EXPO_PUBLIC_PROJECT_ID });
  await supabase.from('push_tokens').upsert({ user_id: userId, token, platform: Platform.OS, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  console.log('Push token registered:', token);
}
