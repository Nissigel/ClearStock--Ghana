import { useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { getToken, clearTokens } from '@/api/client';
import { getMyProfile } from '@/api/auth.api';
import { getSellerProfile } from '@/api/seller.api';
import { useAuthStore } from '@/store/authStore';
import { ClearStockLogo } from '@/components/ui/ClearStockLogo';

// Keep the brand on screen at least this long so it reads as a splash rather
// than a flash, and so the entrance animation has room to play.
const MIN_DISPLAY_MS = 1900;

export default function SplashScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setSellerProfile = useAuthStore((state) => state.setSellerProfile);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const cancelled = useRef(false);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  // The auth store isn't persisted, so a saved token alone leaves the app
  // "logged in" with no user and every screen falls back to a nameless "User".
  // Refill it from the token — but never block on it: the home screen is
  // already showing, so awaiting a sleeping backend here would just blank it.
  const restoreSessionInBackground = async (token: string) => {
    try {
      const profile = await getMyProfile();
      setAuth(profile, token);
      try {
        setSellerProfile(await getSellerProfile());
      } catch {
        // Buyer-only account — no seller profile is normal.
      }
    } catch {
      await clearTokens();
      clearAuth();
      router.replace('/(guest)');
    }
  };

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();

    const run = async () => {
      const start = Date.now();
      let target = '/(guest)';
      let restoreToken: string | null = null;

      try {
        const token = await getToken();
        if (token) {
          target = '/(buyer)/(tabs)/home';
          restoreToken = token;
        } else {
          // First run shows onboarding; after that, straight to the market.
          try {
            const seen = await SecureStore.getItemAsync('hasSeenOnboarding');
            if (!seen) target = '/(guest)/onboarding/1';
          } catch {}
        }
      } catch {
        target = '/(guest)';
      }

      const wait = Math.max(0, MIN_DISPLAY_MS - (Date.now() - start));
      setTimeout(() => {
        if (cancelled.current) return;
        router.replace(target as never);
        if (restoreToken) restoreSessionInBackground(restoreToken);
      }, wait);
    };

    run();
    return () => {
      cancelled.current = true;
    };
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.center}>
        {/* The logo tile stays a fixed dark badge in both themes — like an app
            icon, it's built to sit on any background. */}
        <Animated.View
          style={[
            styles.logoBox,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
        >
          <ClearStockLogo size={56} />
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
          <Text style={[styles.brand, { color: colors.foreground }]}>
            Clear<Text style={{ color: colors.primary }}>Stock</Text>
          </Text>
          <Text style={[styles.brandTag, { color: colors.mutedForeground }]}>
            GHANA · SURPLUS EXCHANGE
          </Text>

          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Buy and sell surplus goods{'\n'}before they go to waste.
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 26,
    backgroundColor: '#0a2416',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#4ade80',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  brand: {
    fontSize: 30,
    fontWeight: '500',
    letterSpacing: -0.5,
  },
  brandTag: {
    fontSize: 10,
    letterSpacing: 2.5,
    marginTop: 6,
  },
  tagline: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 26,
  },
})
