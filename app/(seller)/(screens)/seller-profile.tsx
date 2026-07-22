import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { getSellerProfile, updateSellerProfile } from '@/api/seller.api';
import { FontSize, Spacing, Radius } from '@/constants/theme';

const VERIFICATION_BADGE = {
  VERIFIED: 'verified',
  PENDING: 'pending',
  REJECTED: 'rejected',
  UNVERIFIED: 'unverified',
} as const;

export default function SellerProfileEditScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const sellerProfile = useAuthStore((state) => state.sellerProfile);
  const setSellerProfile = useAuthStore((state) => state.setSellerProfile);

  const [businessName, setBusinessName] = useState('');
  const [marketHub, setMarketHub] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const profile = sellerProfile ?? (await getSellerProfile());
      if (profile) {
        setSellerProfile(profile);
        setBusinessName(profile.businessName ?? '');
        setMarketHub(profile.marketHub);
        setBusinessDescription(profile.businessDescription);
      }
      setLoadingProfile(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!marketHub.trim() || !businessDescription.trim()) {
      setError('Market hub and business description are required');
      return;
    }
    try {
      setSaving(true);
      const updated = await updateSellerProfile({
        businessName: businessName.trim() || null,
        marketHub: marketHub.trim(),
        businessDescription: businessDescription.trim(),
      });
      setSellerProfile(updated);
      router.back();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader
        showBack
        title="Seller Profile"
        onBackPress={() => router.back()}
      />
      {loadingProfile ? (
        <View style={styles.container}>
          <Text style={[styles.text, { color: colors.mutedForeground }]}>
            Loading...
          </Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Verification lives on its own screen: it needs documents, and
              submitting it sends the shop back for review, which shouldn't
              happen just because someone edited their shop name here. */}
          {sellerProfile && (
            <Pressable
              onPress={() => router.push('/(seller)/(screens)/verification')}
              style={[
                styles.verificationRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.verificationText}>
                <Badge
                  variant={
                    VERIFICATION_BADGE[sellerProfile.verificationStatus] ??
                    'unverified'
                  }
                />
                <Text
                  style={[styles.verificationHint, { color: colors.mutedForeground }]}
                >
                  {sellerProfile.verificationStatus === 'VERIFIED'
                    ? 'View your submitted documents'
                    : sellerProfile.verificationStatus === 'PENDING'
                      ? 'Documents are being reviewed'
                      : 'Send your Ghana Card to get verified'}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.mutedForeground}
              />
            </Pressable>
          )}

          {sellerProfile?.rejectionReason && (
            <Text style={[styles.rejectionReason, { color: colors.destructive }]}>
              {sellerProfile.rejectionReason}
            </Text>
          )}

          {error && (
            <Text style={[styles.error, { color: colors.destructive }]}>
              {error}
            </Text>
          )}

          <Input
            label="Business Name (Optional)"
            placeholder="e.g. Kofi Traders"
            value={businessName}
            onChangeText={setBusinessName}
            leftIcon="business-outline"
          />

          <Input
            label="Market Hub"
            placeholder="e.g. Kantamanto Market, Kumasi Central"
            value={marketHub}
            onChangeText={setMarketHub}
            leftIcon="location-outline"
          />

          <Input
            label="Business Description"
            placeholder="Tell buyers what you sell..."
            value={businessDescription}
            onChangeText={setBusinessDescription}
            multiline
            numberOfLines={4}
          />

          <Button
            label="Save Changes"
            onPress={handleSave}
            loading={saving}
            style={styles.button}
          />
        </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.base,
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.md,
    paddingBottom: Spacing['4xl'],
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  verificationText: { flex: 1, alignItems: 'flex-start', gap: Spacing.xs },
  verificationHint: { fontSize: FontSize.sm },
  rejectionReason: { fontSize: FontSize.sm },
  error: { fontSize: FontSize.sm },
  text: { fontSize: FontSize.base, textAlign: 'center' },
  button: { marginTop: Spacing.md },
});
