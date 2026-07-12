import { useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { getToken } from '@/api/client';
import { FontFamily, FontSize, Spacing } from '@/constants/theme';
import { ClearStockLogo } from '@/components/ui/ClearStockLogo';

export default function SplashScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const logoOpacity = useRef<Animated.Value>(new Animated.Value(0)).current;
  const logoScale = useRef<Animated.Value>(new Animated.Value(0.7)).current;
  const nameOpacity = useRef<Animated.Value>(new Animated.Value(0)).current;
  const regionOpacity = useRef<Animated.Value>(new Animated.Value(0)).current;
  const taglineOpacity = useRef<Animated.Value>(new Animated.Value(0)).current;
  const screenOpacity = useRef<Animated.Value>(new Animated.Value(1)).current;
  
  const dot1Scale = useRef<Animated.Value>(new Animated.Value(1)).current;
  const dot2Scale = useRef<Animated.Value>(new Animated.Value(1)).current;
  const dot3Scale = useRef<Animated.Value>(new Animated.Value(1)).current;

  const navigateAfterSplash = async () => {
    try {
      const token = await getToken();
      if (token) {
        router.replace('/(buyer)/(tabs)/home');
        return;
      }

      // if user hasn't seen onboarding, show it first
      try {
        const seen = await SecureStore.getItemAsync('hasSeenOnboarding');
        if (!seen) {
          router.replace('/(guest)/onboarding/1');
          return;
        }
      } catch {}
      router.replace('/(guest)');
    } catch {
      router.replace('/(guest)');
    }
  };

  useEffect(() => {
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(nameOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(regionOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.delay(800),
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigateAfterSplash();
    });

    // Loading dots pulse animation
    const createPulseAnimation = (animValue: Animated.Value, delay: number) => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 0.6,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    };

    createPulseAnimation(dot1Scale, 1600);
    createPulseAnimation(dot2Scale, 1900);
    createPulseAnimation(dot3Scale, 2200);
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.background },
        { opacity: screenOpacity },
      ]}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>

          {/* Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <ClearStockLogo size={140} />

          </Animated.View>

          {/* App Name */}
          <Animated.Text
            style={[
              styles.appName,
              { color: colors.foreground, opacity: nameOpacity },
            ]}
          >
            ClearStock
          </Animated.Text>

          {/* Region */}
          <Animated.Text
            style={[
              styles.region,
              { color: colors.gold, opacity: regionOpacity },
            ]}
          >
            GHANA
          </Animated.Text>

          {/* Tagline */}
          <Animated.Text
            style={[
              styles.tagline,
              { color: colors.mutedForeground, opacity: taglineOpacity },
            ]}
          >
            Fast Deals on Stock That Can't Wait.
          </Animated.Text>
        </View>

        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingDot,
              { backgroundColor: colors.primary, transform: [{ scale: dot1Scale }] },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              { backgroundColor: colors.primary, transform: [{ scale: dot2Scale }] },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              { backgroundColor: colors.primary, transform: [{ scale: dot3Scale }] },
            ]}
          />
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
  },
  /*
 logoContainer: {
    marginBottom: -10,
  },
  */
  logoContainer: {
    marginBottom: -20,
  },
  appName: {
    fontSize: FontSize['3xl'],
    fontFamily: FontFamily.displayBold,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  /*
  appName: {
    fontSize: FontSize['3xl'],
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },*/
  divider: {
    width: 60,
    height: 2,
    marginVertical: Spacing.xs,
  },
  region: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    letterSpacing: 6,
    marginBottom: Spacing.md,
  },
  /*
  region: {
    fontSize: FontSize.md,
    letterSpacing: 6,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  tagline: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
    opacity: 0.85,
    paddingHorizontal: Spacing.xl,
  },
*/
  tagline: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.9,
    paddingHorizontal: Spacing.base,
    maxWidth: 280,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: Spacing.lg,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: Spacing.xs,
  },
});