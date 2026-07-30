import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { KeyboardAvoidingWrapper } from '@/components/ui/KeyboardAvoidingWrapper';
import { useAuthStore } from '@/store/authStore';
import { useModeStore } from '@/store/modeStore';
import { becomeSeller, submitVerification } from '@/api/seller.api';
import { uploadImages } from '@/api/upload.api';
import { SellerTermsModal } from '@/components/ui/SellerTermsModal';
import { FontSize, Spacing, Radius } from '@/constants/theme';
import { SELLER_TYPES, SELLER_TYPE_DESCRIPTIONS, type SellerType } from '@/constants/sellerTypes';

type DocumentSlot = 'card' | 'businessReg';

// Remembered for the session so the seller terms are shown only the first time
// a buyer opens this screen — this screen is only ever reached when a buyer
// chooses to become a seller, so acknowledging it once is enough.
let sellerTermsAcknowledged = false;

export default function BecomeSellerScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const setSellerProfile = useAuthStore((state) => state.setSellerProfile);
  const switchToSeller = useModeStore((state) => state.switchToSeller);

  const [sellerType, setSellerType] = useState<SellerType | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [marketHub, setMarketHub] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardPhotoUrl, setCardPhotoUrl] = useState<string | null>(null);
  const [businessRegUrl, setBusinessRegUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<DocumentSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTerms, setShowTerms] = useState(!sellerTermsAcknowledged);

  // Lets the seller pick a photo from their library and uploads it to the
  // image host, so the "Upload" controls actually attach a document instead of
  // doing nothing.
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

  const handleAgreeTerms = () => {
    sellerTermsAcknowledged = true;
    setShowTerms(false);
  };

  const handleDeclineTerms = () => {
    setShowTerms(false);
    // Becoming a seller means accepting the terms, so backing out returns them
    // to where they came from rather than into the form.
    router.back();
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!sellerType) newErrors.sellerType = 'Please select a seller type';
    if (!businessName.trim()) newErrors.businessName = 'Business or store name is required';
    if (!marketHub.trim()) newErrors.marketHub = 'Market hub is required';
    if (!businessDescription.trim()) newErrors.businessDescription = 'Business description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      let profile = await becomeSeller({
        sellerType: sellerType!,
        businessName: businessName.trim() || null,
        marketHub: marketHub.trim(),
        businessDescription: businessDescription.trim(),
      });
      // If they attached their Ghana Card here, send it straight for review so
      // the optional documents they added actually get submitted. Needs a card
      // number to submit; without one they can finish later on the verification
      // screen.
      if (cardPhotoUrl && cardNumber.trim()) {
        try {
          profile = await submitVerification({
            ghanaCardNumber: cardNumber.trim(),
            ghanaCardPhotoUrl: cardPhotoUrl,
            businessRegUrl: businessRegUrl ?? null,
          });
        } catch {
          // Becoming a seller still succeeded — don't block that on the
          // optional verification step failing.
        }
      }
      setSellerProfile(profile);
      switchToSeller();
      router.replace('/(seller)/(tabs)/dashboard');
    } catch {
      setErrors({ submit: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingWrapper containerStyle={{ backgroundColor: colors.background }}>
        <View style={[styles.topSection, { backgroundColor: colors.background }]}>
          <ScreenHeader
            showBack
            transparent
            containerStyle={styles.header}
            onBackPress={() => router.back()}
          />
          <Text style={[styles.topTitle, { color: colors.gold }]}>
            Become a Seller
          </Text>
          <Text style={[styles.topSubtitle, { color: colors.mutedForeground }]}>
            Start selling your surplus stock on ClearStock Ghana
          </Text>
        </View>

        <View style={[styles.bottomSection, { backgroundColor: colors.background }]}>
          <Text style={[styles.heading, { color: colors.foreground }]}>
            Tell us about your business
          </Text>

          {errors.submit && (
            <Text style={[styles.error, { color: colors.destructive }]}>
              {errors.submit}
            </Text>
          )}

          <Text style={[styles.label, { color: colors.foreground }]}>
            Seller Type
          </Text>
          {errors.sellerType && (
            <Text style={[styles.error, { color: colors.destructive }]}>
              {errors.sellerType}
            </Text>
          )}
          <View style={styles.sellerTypes}>
            {SELLER_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setSellerType(type)}
                style={[
                  styles.sellerTypeCard,
                  {
                    backgroundColor:
                      sellerType === type ? colors.primary : colors.card,
                    borderColor:
                      sellerType === type ? colors.primary : colors.border,
                    borderRadius: Radius.md,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sellerTypeTitle,
                    {
                      color:
                        sellerType === type
                          ? colors.primaryForeground
                          : colors.foreground,
                    },
                  ]}
                >
                  {type}
                </Text>
                <Text
                  style={[
                    styles.sellerTypeDesc,
                    {
                      color:
                        sellerType === type
                          ? colors.primaryForeground
                          : colors.mutedForeground,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {SELLER_TYPE_DESCRIPTIONS[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Business / Store Name"
            placeholder="e.g. Kofi Traders"
            value={businessName}
            onChangeText={setBusinessName}
            error={errors.businessName}
            leftIcon="business-outline"
          />

          <Input
            label="Market Hub"
            placeholder="e.g. Kantamanto Market, Kumasi Central"
            value={marketHub}
            onChangeText={setMarketHub}
            error={errors.marketHub}
            leftIcon="location-outline"
            hint="Where is your primary place of business?"
          />

          <Input
            label="Business Description"
            placeholder="Tell buyers what you sell..."
            value={businessDescription}
            onChangeText={setBusinessDescription}
            error={errors.businessDescription}
            multiline
            numberOfLines={4}
          />
          <Text style={[styles.label, { color: colors.foreground }]}>
            Verification Documents (Optional)
          </Text>
          <Text style={[styles.verifyHint, { color: colors.mutedForeground }]}>
            Add your Ghana Card and business registration to get verified.
            Verified sellers earn more trust from buyers. You can also do this
            later from your seller profile.
          </Text>

          <Input
            label="Ghana Card Number"
            placeholder="GHA-000000000-0"
            value={cardNumber}
            onChangeText={setCardNumber}
            autoCapitalize="characters"
            leftIcon="card-outline"
          />

          <View style={styles.slot}>
            <Text style={[styles.slotLabel, { color: colors.foreground }]}>
              Ghana Card Photo
            </Text>
            <Pressable
              onPress={() => pickDocument('card')}
              disabled={uploading !== null}
              style={[
                styles.dropZone,
                { borderColor: colors.border, backgroundColor: colors.muted },
              ]}
            >
              {uploading === 'card' ? (
                <ActivityIndicator color={colors.primary} />
              ) : cardPhotoUrl ? (
                <Image
                  source={{ uri: cardPhotoUrl }}
                  style={styles.preview}
                  resizeMode="cover"
                />
              ) : (
                <>
                  <Ionicons
                    name="camera-outline"
                    size={26}
                    color={colors.mutedForeground}
                  />
                  <Text style={[styles.dropHint, { color: colors.mutedForeground }]}>
                    Tap to add a clear photo of the front
                  </Text>
                </>
              )}
            </Pressable>
            {cardPhotoUrl && (
              <Pressable onPress={() => pickDocument('card')}>
                <Text style={[styles.replace, { color: colors.primary }]}>
                  Change photo
                </Text>
              </Pressable>
            )}
          </View>

          <View style={styles.slot}>
            <Text style={[styles.slotLabel, { color: colors.foreground }]}>
              Business Registration
            </Text>
            <Pressable
              onPress={() => pickDocument('businessReg')}
              disabled={uploading !== null}
              style={[
                styles.dropZone,
                { borderColor: colors.border, backgroundColor: colors.muted },
              ]}
            >
              {uploading === 'businessReg' ? (
                <ActivityIndicator color={colors.primary} />
              ) : businessRegUrl ? (
                <Image
                  source={{ uri: businessRegUrl }}
                  style={styles.preview}
                  resizeMode="cover"
                />
              ) : (
                <>
                  <Ionicons
                    name="camera-outline"
                    size={26}
                    color={colors.mutedForeground}
                  />
                  <Text style={[styles.dropHint, { color: colors.mutedForeground }]}>
                    Only if your shop is registered
                  </Text>
                </>
              )}
            </Pressable>
            {businessRegUrl && (
              <Pressable onPress={() => pickDocument('businessReg')}>
                <Text style={[styles.replace, { color: colors.primary }]}>
                  Change photo
                </Text>
              </Pressable>
            )}
          </View>

          <Button
            label="Become a Seller"
            onPress={handleSubmit}
            loading={loading}
            style={styles.button}
          />
        </View>
      </KeyboardAvoidingWrapper>

      <SellerTermsModal
        visible={showTerms}
        onAgree={handleAgreeTerms}
        onCancel={handleDeclineTerms}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topSection: {
    paddingBottom: Spacing['3xl'],
    paddingHorizontal: Spacing.base,
  },
  header: { borderBottomWidth: 0, paddingHorizontal: 0 },
  topTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  topSubtitle: { fontSize: FontSize.sm, opacity: 0.85 },
  bottomSection: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
    paddingTop: Spacing['2xl'],
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  heading: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  error: { fontSize: FontSize.xs, marginBottom: Spacing.sm },
  sellerTypes: { gap: Spacing.sm, marginBottom: Spacing.lg },
  sellerTypeCard: {
    padding: Spacing.md,
    borderWidth: 1.5,
  },
  verifyHint: {
    fontSize: FontSize.xs,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  slot: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  slotLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  dropZone: {
    height: 150,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    overflow: 'hidden',
  },
  preview: { width: '100%', height: '100%' },
  dropHint: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.base,
  },
  replace: { fontSize: FontSize.sm, fontWeight: '600' },
  sellerTypeTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  sellerTypeDesc: { fontSize: FontSize.xs },
  button: { marginTop: Spacing.lg },
});