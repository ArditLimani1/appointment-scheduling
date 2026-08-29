// Import the per-weight subpaths, never the package root: the root index
// re-exports every weight and italic, and Metro then bundles all 25 faces
// (~8 MB) instead of the six actually used.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import { Manrope_800ExtraBold } from '@expo-google-fonts/manrope/800ExtraBold';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/store';
import { ToastProvider } from '@/components/Toast';
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

  // Manrope (headline) + Inter (body), the web's two families. Every
  // `typography.*` token names one of these, so hold the splash until they land
  // or the first frame renders in the system font and then reflows.
  const [fontsLoaded, fontError] = useFonts({
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const fontsReady = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    void useAuth.getState().hydrate();
  }, []);

  useEffect(() => {
    if (status !== 'booting' && fontsReady) {
      void SplashScreen.hideAsync();
    }
  }, [status, fontsReady]);

  if (status === 'booting' || !fontsReady) {
    return <LoadingView />;
  }

  return (
    <I18nProvider key={locale ?? 'sq'} initialLocale={locale ?? 'sq'}>
      {/* ToastProvider sits inside I18nProvider: the dismiss label is translated. */}
      <ToastProvider>
        {/* Android 15+ is edge-to-edge, so only the icon style applies here;
            the surface colour comes from the Stack contentStyle below. */}
        <StatusBar style="dark" />
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
      </ToastProvider>
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
