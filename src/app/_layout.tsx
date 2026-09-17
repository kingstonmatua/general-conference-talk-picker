import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthSheet } from '@/components/auth-sheet';
import { AuthProvider } from '@/hooks/use-auth';
import { TalkStatusProvider } from '@/hooks/use-talk-status';

SplashScreen.preventAutoHideAsync();

/**
 * Root Stack — holds the 4-tab group (`(tabs)`) as one screen plus screens
 * that live outside the tab bar entirely (talk detail, the design-system
 * reference). This is required: expo-router/ui's <Tabs>/<TabSlot> (used
 * inside `(tabs)/_layout.tsx`) only renders routes registered as a
 * <TabTrigger> — anything else silently falls back to the first tab
 * instead of rendering, which is why talk/[id] and design-system must be
 * siblings of `(tabs)` in a real Stack, not routes reached "through" it.
 *
 * Providers live here (not inside the tabs group) so every screen —
 * including talk/[id] and design-system — shares one auth/talk-status
 * context.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <TalkStatusProvider>
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="talk/[id]" />
            <Stack.Screen name="account" />
            <Stack.Screen name="privacy" />
            <Stack.Screen name="support" />
            <Stack.Screen name="design-system" />
          </Stack>
          <AuthSheet />
        </TalkStatusProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
