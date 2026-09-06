import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRegisterDevice } from '@/api/queries';
import { useAuth } from '@/auth/store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Registers the device's Expo push token with the API once signed in, and
 * routes notification taps to the appointments screen.
 */
export function usePushRegistration() {
  const status = useAuth((s) => s.status);
  const registerDevice = useRegisterDevice();
  const registered = useRef(false);

  useEffect(() => {
    if (status !== 'signedIn' || registered.current) return;
    // Real devices always; in dev also the Android emulator, which does get an FCM
    // token when Play Services are present. iOS simulators never get an APNs one.
    if (!Device.isDevice && !(__DEV__ && Platform.OS === 'android')) return;

    (async () => {
      const permissions = await Notifications.getPermissionsAsync();
      let granted = permissions.granted;
      if (!granted) {
        const request = await Notifications.requestPermissionsAsync();
        granted = request.granted;
      }
      if (!granted) return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });
      }

      try {
        const token = await Notifications.getExpoPushTokenAsync();
        registered.current = true;
        registerDevice.mutate({
          expo_push_token: token.data,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
          device_name: Device.deviceName ?? undefined,
        });
      } catch {
        // Missing EAS projectId in dev — push works in real builds.
      }
    })();
  }, [status, registerDevice]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { type?: string; date?: string };
      if (data?.type?.startsWith('appointment')) {
        router.push({ pathname: '/(app)/appointments', params: data.date ? { date: data.date } : {} });
      }
    });
    return () => subscription.remove();
  }, []);
}
