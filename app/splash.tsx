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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.brandGreen }]}>
      <View style={styles.center}>
        {/* The mark is designed on white, so it sits on a white tile in both
            themes — like an app icon, it reads on any background. */}
        <Animated.View
          style={[
            styles.logoBox,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
        >
          <ClearStockLogo size={104} radius={26} />
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
          {/* Gold "Clear" with white "Stock" — the theme's green would be
              invisible against the green backdrop. */}
          <Text style={[styles.brand, { color: colors.gold }]}>
            Clear<Text style={{ color: colors.brandGreenForeground }}>Stock</Text>
          </Text>
          {/* GHANA sits under the wordmark as it does in the logo, rather than
              buried in a line of small print. */}
          <View style={styles.regionRow}>
            <View style={[styles.regionRule, { backgroundColor: colors.gold }]} />
            <Text style={[styles.region, { color: colors.brandGreenForeground }]}>
              GHANA
            </Text>
            <View style={[styles.regionRule, { backgroundColor: colors.gold }]} />
          </View>

          <Text style={[styles.tagline, { color: colors.brandGreenMuted }]}>
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
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    // A soft lift so the white tile doesn't float flat on a light background.
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  brand: {
    fontSize: 30,
    fontWeight: '500',
    letterSpacing: -0.5,
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  regionRule: {
    width: 26,
    height: 1,
    opacity: 0.8,
  },
  region: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 6,
  },
  tagline: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 26,
  },
})
