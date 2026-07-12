import { Stack } from 'expo-router';
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
} from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { warmUpBackend } from '@/api/client';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Text } from 'react-native';

const queryClient = new QueryClient({
  // Centralised error handling: react-query already captures query errors into
  // state, but attaching a cache-level handler marks them handled so React
  // Native's dev overlay stops flagging them as "unhandled promise rejection".
  queryCache: new QueryCache({
    onError: (error) => {
      console.log('[query error]', (error as Error)?.message ?? error);
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function AppContent() {
  const systemColorScheme = useColorScheme();
  const { applySystemScheme, isDark, colors } = useThemeStore();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    applySystemScheme(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  // Wake the Render backend as early as possible so it's booting while the
  // user moves through the splash / onboarding / auth screens.
  useEffect(() => {
    warmUpBackend();
  }, []);

  // NOTE: onboarding redirect is handled by the splash screen after animations

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  // Apply Inter as default font globally
  (Text as any).defaultProps = (Text as any).defaultProps ?? {};
  (Text as any).defaultProps.style = { fontFamily: 'Inter_400Regular' };

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
        <Stack.Screen name="splash" />
        <Stack.Screen name="index" />
        <Stack.Screen name="(guest)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(buyer)" />
        <Stack.Screen name="(seller)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}