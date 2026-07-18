import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Keyboard,
} from 'react-native';
import { Text } from '@/components/ui/Typography';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { FontSize, Spacing, Radius } from '@/constants/theme';
import { CATEGORIES, type Category } from '@/constants/categories';
import { REGIONS, getCitiesByRegion, type Region } from '@/constants/regions';
import type { ListingFilters } from '@/types/listing.types';
import type { VerificationStatus } from '@/constants/app';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  currentFilters: ListingFilters;
  onApply: (filters: ListingFilters) => void;
}

export function FilterSheet({
  visible,
  onClose,
  currentFilters,
  onApply,
}: FilterSheetProps) {
  const { colors } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(
    currentFilters.category
  );
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>(
    currentFilters.region
  );
  const [selectedCity, setSelectedCity] = useState<string | undefined>(
    currentFilters.cityTown
  );
  const [customCity, setCustomCity] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>(
    currentFilters.minPrice?.toString() ?? ''
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    currentFilters.maxPrice?.toString() ?? ''
  );
  const [verificationStatus, setVerificationStatus] = useState<
    VerificationStatus | undefined
  >(currentFilters.verificationStatus as VerificationStatus | undefined);

  const citySuggestions = selectedRegion
    ? getCitiesByRegion(selectedRegion as Region)
    : [];

  const handleRegionSelect = (region: string) => {
    if (selectedRegion === region) {
      setSelectedRegion(undefined);
      setSelectedCity(undefined);
      setCustomCity('');
    } else {
      setSelectedRegion(region);
      setSelectedCity(undefined);
      setCustomCity('');
    }
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(selectedCity === city ? undefined : city);
    setCustomCity('');
  };

  const handleApply = () => {
    const finalCity = customCity.trim() || selectedCity;
    onApply({
      ...currentFilters,
      category: selectedCategory,
      region: selectedRegion,
      cityTown: finalCity,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      verificationStatus,
      page: 0,
    });
    onClose();
  };

  const handleClear = () => {
    setSelectedCategory(undefined);
    setSelectedRegion(undefined);
    setSelectedCity(undefined);
    setCustomCity('');
    setMinPrice('');
    setMaxPrice('');
    setVerificationStatus(undefined);
  };

  const activeFilterCount = [
    selectedCategory,
    selectedRegion,
    selectedCity || customCity,
    minPrice,
    maxPrice,
    verificationStatus,
  ].filter(Boolean).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => Keyboard.dismiss()}
          style={[styles.sheet, { backgroundColor: colors.background }]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Filter Listings
            </Text>
            <View style={styles.headerRight}>
              {activeFilterCount > 0 && (
                <TouchableOpacity onPress={handleClear}>
                  <Text style={[styles.clearText, { color: colors.destructive }]}>
                    Clear All
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Category */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Category
              </Text>
              <View style={styles.chips}>
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    onPress={() =>
                      setSelectedCategory(
                        selectedCategory === category ? undefined : category
                      )
                    }
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          selectedCategory === category
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
                            selectedCategory === category
                              ? colors.primaryForeground
                              : colors.primary,
                        },
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Range */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Price Range (GHS)
              </Text>
              <View style={styles.priceRow}>
                <View style={styles.priceInputWrapper}>
                  <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>
                    Min
                  </Text>
                  <TextInput
                    value={minPrice}
                    onChangeText={setMinPrice}
                    placeholder="0"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="numeric"
                    style={[
                      styles.priceInput,
                      {
                        color: colors.foreground,
                        backgroundColor: colors.card,
                        borderColor: colors.input,
                        borderRadius: Radius.md,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.priceSeparator, { color: colors.mutedForeground }]}>
                  —
                </Text>
                <View style={styles.priceInputWrapper}>
                  <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>
                    Max
                  </Text>
                  <TextInput
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    placeholder="Any"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="numeric"
                    style={[
                      styles.priceInput,
                      {
                        color: colors.foreground,
                        backgroundColor: colors.card,
                        borderColor: colors.input,
                        borderRadius: Radius.md,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Region */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Region
              </Text>
              <View style={styles.chips}>
                {REGIONS.map((region) => (
                  <TouchableOpacity
                    key={region.name}
                    onPress={() => handleRegionSelect(region.name)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          selectedRegion === region.name
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
                            selectedRegion === region.name
                              ? colors.primaryForeground
                              : colors.primary,
                        },
                      ]}
                    >
                      {region.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* City/Town — only shows when region is selected */}
            {selectedRegion && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  City / Town
                </Text>

                {/* All cities option */}
                <View style={styles.chips}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCity(undefined);
                      setCustomCity('');
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          !selectedCity && !customCity
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
                            !selectedCity && !customCity
                              ? colors.primaryForeground
                              : colors.primary,
                        },
                      ]}
                    >
                      All Cities
                    </Text>
                  </TouchableOpacity>

                  {citySuggestions.map((city) => (
                    <TouchableOpacity
                      key={city}
                      onPress={() => handleCitySelect(city)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor:
                            selectedCity === city
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
                              selectedCity === city
                                ? colors.primaryForeground
                                : colors.primary,
                          },
                        ]}
                      >
                        {city}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom city input */}
                <View style={styles.customCityContainer}>
                  <Text
                    style={[
                      styles.customCityLabel,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    My town is not listed:
                  </Text>
                  <TextInput
                    value={customCity}
                    onChangeText={(text) => {
                      setCustomCity(text);
                      if (text) setSelectedCity(undefined);
                    }}
                    placeholder="Type your city or town"
                    placeholderTextColor={colors.mutedForeground}
                    style={[
                      styles.customCityInput,
                      {
                        color: colors.foreground,
                        backgroundColor: colors.card,
                        borderColor: customCity ? colors.primary : colors.input,
                        borderRadius: Radius.md,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Verification Status */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Seller Verification
              </Text>
              <View style={styles.chips}>
                {(['VERIFIED', 'UNVERIFIED'] as VerificationStatus[]).map(
                  (status) => (
                    <TouchableOpacity
                      key={status}
                      onPress={() =>
                        setVerificationStatus(
                          verificationStatus === status ? undefined : status
                        )
                      }
                      style={[
                        styles.chip,
                        {
                          backgroundColor:
                            verificationStatus === status
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
                              verificationStatus === status
                                ? colors.primaryForeground
                                : colors.primary,
                          },
                        ]}
                      >
                        {status === 'VERIFIED' ? '✓ Verified Only' : 'Unverified'}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button
              label={
                activeFilterCount > 0
                  ? `Apply Filters (${activeFilterCount})`
                  : 'Apply Filters'
              }
              onPress={handleApply}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: Radius.full,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  clearText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  priceInputWrapper: {
    flex: 1,
  },
  priceLabel: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
  },
  priceInput: {
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.base,
  },
  priceSeparator: {
    fontSize: FontSize.lg,
    marginTop: Spacing.lg,
  },
  customCityContainer: {
    marginTop: Spacing.sm,
  },
  customCityLabel: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
  },
  customCityInput: {
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.base,
  },
  footer: {
    padding: Spacing.base,
    borderTopWidth: 0.5,
  },
});