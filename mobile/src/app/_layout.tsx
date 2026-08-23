import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/store';
import { LoadingView } from '@/components/ui';
import { I18nProvider } from '@/i18n';
import { palette } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function Router() {
  const status = useAuth((s) => s.status);
  const locale = useAuth((s) => s.me?.user.locale);

  useEffect(() => {
    void useAuth.getState().hydrate();
  }, []);

  useEffect(() => {
    if (status !== 'booting') {
      void SplashScreen.hideAsync();
    }
  }, [status]);

  if (status === 'booting') {
    return <LoadingView />;
  }

  return (
    <I18nProvider key={locale ?? 'sq'} initialLocale={locale ?? 'sq'}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.surface },
        }}
      >
        <Stack.Protected guard={status === 'signedIn'}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={status === 'signedOut'}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    </I18nProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Router />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
