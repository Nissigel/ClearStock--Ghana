import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateListingStore } from '@/store/createListingStore';
import { createListing, updateListing, getListingById } from '@/api/listing.api';
import { uploadImages } from '@/api/upload.api';
import { useQueryClient } from '@tanstack/react-query';
import { FontSize, Spacing, Radius } from '@/constants/theme';
import { CATEGORIES, type Category } from '@/constants/categories';
import { PREDEFINED_UNITS } from '@/constants/units';
import { MAX_LISTING_IMAGES } from '@/constants/app';

const STEPS = [
  'Basic Info',
  'Images',
  'Inventory',
  'Pricing',
  'Clearance',
];

export default function CreateListingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(isEditing);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const store = useCreateListingStore();

  // In edit mode, load the existing listing and prefill the wizard's store so
  // the seller can change any field and re-submit as an update.
  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const listing = await getListingById(id);
        if (!active) return;
        store.reset();
        store.setField('productName', listing.productName);
        store.setField('category', listing.category);
        store.setField('description', listing.description);
        store.setField('images', listing.images ?? []);
        store.setField('quantity', String(listing.quantity));
        store.setField('unitOfMeasurement', listing.unitOfMeasurement ?? '');
        store.setField('originalPrice', String(listing.originalPrice));
        store.setField('minimumPrice', String(listing.minimumAcceptablePrice));
        store.setField('isExpirySensitive', listing.expirySensitive);
        store.setField('expiryDate', listing.expiryDate ?? '');
        store.setField('clearanceEndDate', listing.clearanceEndDate);
        store.setField(
          'discountStepPercent',
          listing.discountStepPercent != null ? String(listing.discountStepPercent) : ''
        );
        store.setField(
          'discountIntervalDays',
          listing.discountIntervalDays != null ? String(listing.discountIntervalDays) : ''
        );
      } catch {
        Alert.alert('Error', 'Could not load the listing to edit.');
        router.back();
      } finally {
        if (active) setHydrating(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!store.productName.trim()) newErrors.productName = 'Product name is required';
      if (!store.category) newErrors.category = 'Please select a category';
      if (!store.description.trim()) newErrors.description = 'Description is required';
    }

    if (step === 1) {
      if (store.images.length === 0) newErrors.images = 'At least one image is required';
    }

    if (step === 2) {
      if (!store.quantity.trim()) newErrors.quantity = 'Quantity is required';
      if (isNaN(Number(store.quantity)) || Number(store.quantity) <= 0) {
        newErrors.quantity = 'Quantity must be greater than 0';
      }
    }

    if (step === 3) {
      if (!store.originalPrice.trim()) newErrors.originalPrice = 'Original price is required';
      if (!store.minimumPrice.trim()) newErrors.minimumPrice = 'Minimum price is required';
      if (Number(store.minimumPrice) > Number(store.originalPrice)) {
        newErrors.minimumPrice = 'Minimum price cannot exceed original price';
      }
    }

    if (step === 4) {
      if (!store.clearanceEndDate.trim()) newErrors.clearanceEndDate = 'Clearance end date is required';
      if (store.isExpirySensitive && !store.expiryDate.trim()) {
        newErrors.expiryDate = 'Expiry date is required for expiry-sensitive items';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (isEditing) {
      // Discard the prefilled edit so it doesn't leak into a later new listing.
      store.reset();
      router.back();
    } else {
      router.replace('/(seller)/(tabs)/dashboard');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      // Upload locally-picked images to a real host so they display on every
      // device; already-hosted URLs pass through unchanged.
      const hostedImages = await uploadImages(store.images);

      // The backend requires at least one image. If the seller picked images
      // but none uploaded, it's a Cloudinary config problem — say so clearly.
      if (store.images.length > 0 && hostedImages.length === 0) {
        Alert.alert(
          'Image upload failed',
          'Your images could not be uploaded. In Cloudinary, make sure the upload preset is set to "Unsigned" and the cloud name is correct.'
        );
        return;
      }
      if (hostedImages.length === 0) {
        Alert.alert('Add a photo', 'Please add at least one image for your listing.');
        return;
      }

      const payload = {
        productName: store.productName,
        category: store.category!,
        description: store.description,
        quantity: Number(store.quantity),
        unitOfMeasurement: store.unitOfMeasurement || null,
        originalPrice: Number(store.originalPrice),
        minimumAcceptablePrice: Number(store.minimumPrice),
        expirySensitive: store.isExpirySensitive,
        expiryDate: store.expiryDate || null,
        clearanceEndDate: store.clearanceEndDate,
        discountStepPercent: store.discountStepPercent ? Number(store.discountStepPercent) : null,
        discountIntervalDays: store.discountIntervalDays ? Number(store.discountIntervalDays) : null,
        images: hostedImages,
      };

      if (isEditing && id) {
        await updateListing(id, payload);
      } else {
        await createListing(payload);
      }
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['seller-listings'] });
      if (isEditing && id) {
        queryClient.invalidateQueries({ queryKey: ['listing', id] });
      }
      store.reset();
      Alert.alert(
        'Success',
        isEditing ? 'Listing updated successfully!' : 'Listing created successfully!',
        [{ text: 'OK', onPress: () => router.replace('/(seller)/(tabs)/listings') }]
      );
    } catch (err) {
      // Surface the backend's validation message (e.g. "Unit of measurement is
      // required") instead of a generic failure.
      const axiosErr = err as AxiosError<{ message?: string }>;
      const message =
        axiosErr.response?.data?.message ??
        (isEditing
          ? 'Failed to update listing. Please try again.'
          : 'Failed to create listing. Please try again.');
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const remaining = MAX_LISTING_IMAGES - store.images.length;
    if (remaining <= 0) {
      Alert.alert('Maximum images', `You can only add up to ${MAX_LISTING_IMAGES} images`);
      return;
    }

    // Multi-select so the seller can grab several photos in one go. Cropping
    // (allowsEditing) can't be combined with multiple selection, so it's off.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;

    // selectionLimit isn't enforced on every platform, so cap it here too.
    const picked = result.assets.slice(0, remaining);
    picked.forEach((asset) => store.addImage(asset.uri));

    if (result.assets.length > remaining) {
      Alert.alert(
        'Some photos skipped',
        `Only ${remaining} more photo${remaining === 1 ? '' : 's'} could be added — a listing holds up to ${MAX_LISTING_IMAGES}.`
      );
    }
  };

  if (hydrating) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <ScreenHeader showBack onBackPress={() => router.back()} title="Edit Listing" />
        <View style={styles.hydratingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScreenHeader
        showBack
        onBackPress={handleBack}
        title={
          isEditing
            ? `Edit · Step ${currentStep + 1} of ${STEPS.length}`
            : `Step ${currentStep + 1} of ${STEPS.length}`
        }
      />

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: colors.muted }]}>
        <View
          style={[
            styles.progressBar,
            {
              backgroundColor: colors.primary,
              width: `${((currentStep + 1) / STEPS.length) * 100}%`,
            },
          ]}
        />
      </View>

      {/* Step Labels */}
      <View style={styles.stepLabels}>
        {STEPS.map((step, index) => (
          <TouchableOpacity
            key={step}
            onPress={() => {
              if (index < currentStep) setCurrentStep(index);
            }}
          >
            <Text
              style={[
                styles.stepLabel,
                {
                  color:
                    index === currentStep
                      ? colors.primary
                      : index < currentStep
                      ? colors.success
                      : colors.mutedForeground,
                  fontWeight: index === currentStep ? '600' : '400',
                },
              ]}
            >
              {index < currentStep ? '✓ ' : ''}{step}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Step 1 — Basic Info */}
        {currentStep === 0 && (
          <View>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              Basic Information
            </Text>

            <Input
              label="Product Name"
              placeholder="e.g. Indomie Instant Noodles"
              value={store.productName}
              onChangeText={(v) => store.setField('productName', v)}
              error={errors.productName}
              autoCapitalize="words"
            />

            <Text style={[styles.label, { color: colors.foreground }]}>
              Category
            </Text>
            {errors.category && (
              <Text style={[styles.error, { color: colors.destructive }]}>
                {errors.category}
              </Text>
            )}
            <View style={styles.chips}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => store.setField('category', cat)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        store.category === cat ? colors.primary : colors.secondary,
                      borderRadius: Radius.full,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          store.category === cat
                            ? colors.primaryForeground
                            : colors.primary,
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Description"
              placeholder="Describe your product, condition, and any important details..."
              value={store.description}
              onChangeText={(v) => store.setField('description', v)}
              error={errors.description}
              multiline
              numberOfLines={5}
            />
          </View>
        )}

        {/* Step 2 — Images */}
        {currentStep === 1 && (
          <View>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              Product Images
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
              Add up to {MAX_LISTING_IMAGES} photos — you can select several at once
            </Text>

            {errors.images && (
              <Text style={[styles.error, { color: colors.destructive }]}>
                {errors.images}
              </Text>
            )}

            <View style={styles.imagesGrid}>
              {store.images.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    onPress={() => store.removeImage(index)}
                    style={[
                      styles.removeImage,
                      { backgroundColor: colors.destructive },
                    ]}
                  >
                    <Ionicons name="close" size={14} color="white" />
                  </TouchableOpacity>
                </View>
              ))}

              {store.images.length < MAX_LISTING_IMAGES && (
                <TouchableOpacity
                  onPress={handlePickImage}
                  style={[
                    styles.addImageButton,
                    {
                      backgroundColor: colors.secondary,
                      borderColor: colors.border,
                      borderRadius: Radius.md,
                    },
                  ]}
                >
                  <Ionicons
                    name="camera-outline"
                    size={28}
                    color={colors.primary}
                  />
                  <Text style={[styles.addImageText, { color: colors.primary }]}>
                    Add Photo
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Step 3 — Inventory */}
        {currentStep === 2 && (
          <View>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              Inventory
            </Text>

            <Input
              label="Quantity Available"
              placeholder="e.g. 100"
              value={store.quantity}
              onChangeText={(v) => store.setField('quantity', v)}
              error={errors.quantity}
              keyboardType="numeric"
            />

            <Text style={[styles.label, { color: colors.foreground }]}>
              Unit of Measurement (Optional)
            </Text>
            <View style={styles.chips}>
              {PREDEFINED_UNITS.map((unit) => (
                <TouchableOpacity
                  key={unit}
                  onPress={() =>
                    store.setField(
                      'unitOfMeasurement',
                      store.unitOfMeasurement === unit ? '' : unit
                    )
                  }
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        store.unitOfMeasurement === unit
                          ? colors.primary
                          : colors.secondary,
                      borderRadius: Radius.full,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          store.unitOfMeasurement === unit
                            ? colors.primaryForeground
                            : colors.primary,
                      },
                    ]}
                  >
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Custom Unit (if not listed above)"
              placeholder="e.g. Pallets"
              value={
                PREDEFINED_UNITS.includes(store.unitOfMeasurement as any)
                  ? ''
                  : store.unitOfMeasurement
              }
              onChangeText={(v) => store.setField('unitOfMeasurement', v)}
            />
          </View>
        )}

        {/* Step 4 — Pricing */}
        {currentStep === 3 && (
          <View>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              Pricing
            </Text>

            <Input
              label="Original Price (₵)"
              placeholder="e.g. 500.00"
              value={store.originalPrice}
              onChangeText={(v) => store.setField('originalPrice', v)}
              error={errors.originalPrice}
              keyboardType="numeric"
              hint="The original retail price of this product"
            />

            <Input
              label="Minimum Acceptable Price (₵)"
              placeholder="e.g. 300.00"
              value={store.minimumPrice}
              onChangeText={(v) => store.setField('minimumPrice', v)}
              error={errors.minimumPrice}
              keyboardType="numeric"
              hint="The lowest price you are willing to sell at"
            />
          </View>
        )}

        {/* Step 5 — Clearance Settings */}
        {currentStep === 4 && (
          <View>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              Clearance Settings
            </Text>

            <Input
              label="Clearance End Date"
              placeholder="YYYY-MM-DD"
              value={store.clearanceEndDate}
              onChangeText={(v) => store.setField('clearanceEndDate', v)}
              error={errors.clearanceEndDate}
              hint="The date you want this listing to end"
            />

            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <Text style={[styles.switchLabel, { color: colors.foreground }]}>
                  Expiry Sensitive
                </Text>
                <Text
                  style={[styles.switchDesc, { color: colors.mutedForeground }]}
                >
                  Does this product have an expiry date?
                </Text>
              </View>
              <Switch
                value={store.isExpirySensitive}
                onValueChange={(v) => store.setField('isExpirySensitive', v)}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>

            {store.isExpirySensitive && (
              <Input
                label="Expiry Date"
                placeholder="YYYY-MM-DD"
                value={store.expiryDate}
                onChangeText={(v) => store.setField('expiryDate', v)}
                error={errors.expiryDate}
              />
            )}

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Auto-Discount (Optional)
            </Text>
            <Text
              style={[styles.sectionDesc, { color: colors.mutedForeground }]}
            >
              Automatically reduce the price over time to clear stock faster
            </Text>

            <Input
              label="Discount Step (%)"
              placeholder="e.g. 5"
              value={store.discountStepPercent}
              onChangeText={(v) => store.setField('discountStepPercent', v)}
              keyboardType="numeric"
              hint="How much to reduce the price each time"
            />

            <Input
              label="Discount Interval (Days)"
              placeholder="e.g. 7"
              value={store.discountIntervalDays}
              onChangeText={(v) => store.setField('discountIntervalDays', v)}
              keyboardType="numeric"
              hint="How often to apply the discount"
            />
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View
        style={[
          styles.bottomNav,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Button
          label={
            currentStep === STEPS.length - 1
              ? isEditing
                ? 'Save Changes'
                : 'Publish Listing'
              : 'Next'
          }
          onPress={handleNext}
          loading={loading}
          style={styles.nextButton}
        />
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  hydratingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    height: 4,
    width: '100%',
  },
  progressBar: {
    height: 4,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 0.5,
  },
  stepLabel: {
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: Spacing['4xl'],
  },
  stepTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  error: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: Radius.md,
  },
  removeImage: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButton: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: Spacing.xs,
  },
  addImageText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  switchText: { flex: 1 },
  switchLabel: {
    fontSize: FontSize.base,
    fontWeight: '500',
    marginBottom: 2,
  },
  switchDesc: { fontSize: FontSize.xs },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
    marginTop: Spacing.lg,
  },
  sectionDesc: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.lg,
  },
  bottomNav: {
    padding: Spacing.base,
    borderTopWidth: 0.5,
  },
  nextButton: { width: '100%' },
});