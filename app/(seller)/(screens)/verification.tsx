import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { getSellerProfile, submitVerification } from '@/api/seller.api';
import { uploadImages } from '@/api/upload.api';
import { FontSize, Spacing, Radius } from '@/constants/theme';

type DocumentSlot = 'card' | 'businessReg';

/** What the seller sees for each state, in plain language. */
const STATUS_COPY = {
  UNVERIFIED: {
    icon: 'shield-outline' as const,
    title: 'Not verified yet',
    body: 'Verified shops get a badge buyers can trust. Send your Ghana Card to get yours.',
  },
  PENDING: {
    icon: 'time-outline' as const,
    title: 'Under review',
    body: 'We have your documents. Reviews usually finish within a few working days.',
  },
  VERIFIED: {
    icon: 'shield-checkmark' as const,
    title: 'Verified shop',
    body: 'Your documents were approved. Buyers can see your verified badge.',
  },
  REJECTED: {
    icon: 'alert-circle-outline' as const,
    title: 'Not approved',
    body: 'Something was wrong with your documents. Fix it below and send them again.',
  },
};

export default function SellerVerificationScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const sellerProfile = useAuthStore((state) => state.sellerProfile);
  const setSellerProfile = useAuthStore((state) => state.setSellerProfile);

  const [cardNumber, setCardNumber] = useState('');
  const [cardPhotoUrl, setCardPhotoUrl] = useState<string | null>(null);
  const [businessRegUrl, setBusinessRegUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<DocumentSlot | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const profile = sellerProfile ?? (await getSellerProfile());
      if (profile) {
        setSellerProfile(profile);
        setCardNumber(profile.ghanaCardNumber ?? '');
        setCardPhotoUrl(profile.ghanaCardPhotoUrl);
        setBusinessRegUrl(profile.businessRegUrl);
      }
      setLoadingProfile(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const status = sellerProfile?.verificationStatus ?? 'UNVERIFIED';
  const isVerified = status === 'VERIFIED';
  const isPending = status === 'PENDING';
  const copy = STATUS_COPY[status] ?? STATUS_COPY.UNVERIFIED;

  const pickDocument = async (slot: DocumentSlot) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(slot);
    try {
      const [hosted] = await uploadImages([result.assets[0].uri]);
      if (!hosted) {
        Alert.alert(
          'Upload failed',
          'Could not upload that photo. Please check your connection and try again.'
        );
        return;
      }
      if (slot === 'card') setCardPhotoUrl(hosted);
      else setBusinessRegUrl(hosted);
    } catch {
      Alert.alert('Upload failed', 'Could not upload that photo. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async () => {
    if (!cardNumber.trim()) {
      setError('Enter your Ghana Card number');
      return;
    }
    if (!cardPhotoUrl) {
      setError('Add a photo of your Ghana Card');
      return;
    }
    setError('');
    try {
      setSubmitting(true);
      const updated = await submitVerification({
        ghanaCardNumber: cardNumber.trim(),
        ghanaCardPhotoUrl: cardPhotoUrl,
        businessRegUrl: businessRegUrl ?? null,
      });
      setSellerProfile(updated);
      Alert.alert(
        'Documents sent',
        'We will review them and update your shop once it is done.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderUploadSlot = (
    slot: DocumentSlot,
    label: string,
    hint: string,
    uri: string | null
  ) => (
    <View style={styles.slot}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <Pressable
        onPress={() => pickDocument(slot)}
        disabled={isVerified || uploading !== null}
        style={[
          styles.dropZone,
          {
            borderColor: colors.border,
            backgroundColor: colors.muted,
            opacity: isVerified ? 0.6 : 1,
          },
        ]}
      >
        {uploading === slot ? (
          <ActivityIndicator color={colors.primary} />
        ) : uri ? (
          <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <>
            <Ionicons name="camera-outline" size={28} color={colors.mutedForeground} />
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>{hint}</Text>
          </>
        )}
      </Pressable>
      {uri && !isVerified && (
        <Pressable onPress={() => pickDocument(slot)}>
          <Text style={[styles.replace, { color: colors.primary }]}>
            Change photo
          </Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader showBack title="Verification" onBackPress={() => router.back()} />
      {loadingProfile ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
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
            <View
              style={[
                styles.statusCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name={copy.icon}
                size={28}
                color={isVerified ? colors.primary : colors.mutedForeground}
              />
              <View style={styles.statusText}>
                <Text style={[styles.statusTitle, { color: colors.foreground }]}>
                  {copy.title}
                </Text>
                <Text style={[styles.statusBody, { color: colors.mutedForeground }]}>
                  {copy.body}
                </Text>
              </View>
            </View>

            {sellerProfile?.rejectionReason && (
              <Text style={[styles.error, { color: colors.destructive }]}>
                {sellerProfile.rejectionReason}
              </Text>
            )}

            {error !== '' && (
              <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
            )}

            <Input
              label="Ghana Card Number"
              placeholder="GHA-000000000-0"
              value={cardNumber}
              onChangeText={setCardNumber}
              editable={!isVerified}
              autoCapitalize="characters"
              leftIcon="card-outline"
            />

            {renderUploadSlot(
              'card',
              'Ghana Card Photo',
              'Tap to add a clear photo of the front',
              cardPhotoUrl
            )}

            {renderUploadSlot(
              'businessReg',
              'Business Registration (Optional)',
              'Only if your shop is registered',
              businessRegUrl
            )}

            {!isVerified && (
              <Button
                label={isPending ? 'Resend documents' : 'Submit for verification'}
                onPress={handleSubmit}
                loading={submitting}
                disabled={uploading !== null}
                style={styles.button}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: Spacing.base,
    gap: Spacing.md,
    paddingBottom: Spacing['4xl'],
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  statusText: { flex: 1, gap: 2 },
  statusTitle: { fontSize: FontSize.base, fontWeight: '600' },
  statusBody: { fontSize: FontSize.sm, lineHeight: 20 },
  slot: { gap: Spacing.xs },
  label: { fontSize: FontSize.sm, fontWeight: '600' },
  dropZone: {
    height: 160,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    overflow: 'hidden',
  },
  preview: { width: '100%', height: '100%' },
  hint: { fontSize: FontSize.sm, textAlign: 'center', paddingHorizontal: Spacing.base },
  replace: { fontSize: FontSize.sm, fontWeight: '600' },
  error: { fontSize: FontSize.sm },
  button: { marginTop: Spacing.md },
});
