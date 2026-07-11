import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { FontSize, Spacing, FontFamily } from '@/constants/theme';

export default function OnboardingTwo() {
  const { colors } = useTheme();
  const router = useRouter();

  const handleSkip = async () => {
    try {
      await SecureStore.setItemAsync('hasSeenOnboarding', 'true');
    } catch {}
    router.replace('/(auth)/phone');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={handleSkip} style={styles.skipPressable}>
            <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.main}>
          <View style={styles.cardImage}>
            <Image
              source={require('../../../assets/onboarding-2.jpg')}
              style={styles.image}
              resizeMode="cover"
            />

            <View style={[styles.badge, { backgroundColor: '#0EA44B' }]}> 
              <Ionicons name="checkmark-circle" size={10} color="#fff" style={styles.badgeIcon} />
              <Text style={styles.badgeText}>Verified Seller</Text>
            </View>

            <View style={styles.imageLabel}>
              <View style={styles.imageLabelTitleRow}>
                <Ionicons name="pricetag-outline" size={14} color="#1F2937" style={styles.labelIcon} />
                <Text style={styles.imageLabelTitle}>Saved Deal</Text>
              </View>
              <Text style={styles.imageLabelSubtitle}>Ankara Fabric — GHS 38</Text>
            </View>
          </View>

          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.foreground }]}>Find the Best Deals Near You</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Browse clearance deals from verified sellers across Ghana. Save money on quality goods from trusted importers.</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={async () => {
              try {
                await SecureStore.setItemAsync('hasSeenOnboarding', 'true');
              } catch {}
              router.replace('/(auth)/phone');
            }}
          >
            <Text style={[styles.buttonText, { color: colors.gold }]}>Get Started →</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: Spacing.base, alignItems: 'center', justifyContent: 'flex-start' },
  header: { width: '100%', alignItems: 'flex-end' },
  skipPressable: { padding: Spacing.xs },
  skipText: { fontSize: FontSize.sm, fontFamily: FontFamily.displayMedium },
  main: { width: '100%', flex: 1, justifyContent: 'center', alignItems: 'center' },
  topLogo: { marginTop: Spacing.md, alignItems: 'center' },
  cardImage: { width: '100%', alignItems: 'center', position: 'relative', marginBottom: Spacing.lg },
  image: { width: 280, height: 235, borderRadius: 20, resizeMode: 'cover', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 },
  content: { alignItems: 'center', paddingHorizontal: Spacing.base, marginTop: Spacing.sm },
  title: { fontSize: FontSize['2xl'], fontFamily: FontFamily.displayBold, textAlign: 'center', marginTop: Spacing.xs },
  subtitle: { fontSize: FontSize.sm, fontFamily: FontFamily.regular, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 22 },
  footer: { width: '100%', alignItems: 'center', marginBottom: Spacing.lg, marginTop: 'auto' },
  button: { width: '92%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: FontSize.base, fontFamily: FontFamily.displayBold, lineHeight: 22 },
  badge: { position: 'absolute', top: -10, left: 20, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 18, flexDirection: 'row', alignItems: 'center' },
  badgeIcon: { marginRight: 6 },
  badgeText: { color: '#fff', fontSize: FontSize.xs, fontFamily: FontFamily.displayBold },
  imageLabel: { position: 'absolute', bottom: -18, left: '56%', transform: [{ translateX: -100 }], width: 200, backgroundColor: '#fff', borderRadius: 12, padding: 10, alignItems: 'flex-start', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  imageLabelTitleRow: { flexDirection: 'row', alignItems: 'center' },
  labelIcon: { marginRight: 6 },
  imageLabelTitle: { fontSize: FontSize.sm, color: '#1F2937', fontFamily: FontFamily.displayMedium },
  imageLabelSubtitle: { fontSize: FontSize.xs, fontFamily: FontFamily.regular, color: '#4B5563', marginTop: 4 },
});
