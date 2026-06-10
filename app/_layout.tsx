import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '../src/hooks/useAuth';
import { AppSplash } from '../src/components/AppSplash';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Treat font errors as "ready" so they never block the splash indefinitely
  const fontsReady = fontsLoaded || !!fontError;

  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  // Hard fallback: always hide the native splash within 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!fontsReady || loading) return;
    SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady, loading]);

  useEffect(() => {
    if (loading || !fontsReady || !navigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (user && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [user, loading, fontsReady, segments, navigationState?.key]);

  if (!fontsReady || loading) return <AppSplash />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
