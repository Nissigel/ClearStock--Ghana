import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { KeyboardAvoidingWrapper } from '@/components/ui/KeyboardAvoidingWrapper';
import { useAuthStore } from '@/store/authStore';
import { useModeStore } from '@/store/modeStore';
import { becomeSeller } from '@/api/seller.api';
import { SellerTermsModal } from '@/components/ui/SellerTermsModal';
import { FontSize, Spacing, Radius } from '@/constants/theme';
import { SELLER_TYPES, SELLER_TYPE_DESCRIPTIONS, type SellerType } from '@/constants/sellerTypes';

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
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTerms, setShowTerms] = useState(!sellerTermsAcknowledged);

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
      const profile = await becomeSeller({
        sellerType: sellerType!,
        businessName: businessName.trim() || null,
        marketHub: marketHub.trim(),
        businessDescription: businessDescription.trim(),
      });
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
            Upload your Ghana Card and business registration to get verified.
            Verified sellers get more trust from buyers.
          </Text>
          <Button
            label="Upload Ghana Card"
            onPress={() => {}}
            variant="outline"
            style={styles.uploadButton}
          />
          <Button
            label="Upload Business Registration"
            onPress={() => {}}
            variant="outline"
            style={styles.uploadButton}
          />

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
  uploadButton: {
    marginBottom: Spacing.sm,
  },
  sellerTypeTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  sellerTypeDesc: { fontSize: FontSize.xs },
  button: { marginTop: Spacing.lg },
});