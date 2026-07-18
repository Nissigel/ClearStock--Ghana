import {
  View,
  Text,
  StyleSheet,
  Keyboard,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BrandHeader } from '@/components/ui/BrandHeader';
import { ListingGrid } from '@/components/ui/listing/ListingGrid';
import { useListings } from '@/hooks/useListings';
import { useAuthStore } from '@/store/authStore';
import { CATEGORIES, type Category } from '@/constants/categories';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';
import type { ListingSummary } from '@/types/listing.types';

/** A face for each category, so the grid scans visually rather than as a list. */
const CATEGORY_ICONS: Record<Category, React.ComponentProps<typeof Ionicons>['name']> = {
  'Food & Beverages': 'fast-food-outline',
  Groceries: 'basket-outline',
  Cosmetics: 'sparkles-outline',
  Electronics: 'phone-portrait-outline',
  'Clothing & Fashion': 'shirt-outline',
  'Household Items': 'home-outline',
  'Office Supplies': 'briefcase-outline',
  'Industrial Supplies': 'construct-outline',
  Other: 'ellipsis-horizontal-outline',
};

export default function SearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const sellerProfile = useAuthStore((state) => state.sellerProfile);

  const isBrowsing = !search.trim() && !category;

  const { data, isLoading, isError, refetch, isRefetching } = useListings({
    search,
    category: category ?? undefined,
    page: 0,
    // Wide enough to count deals per category off a single fetch rather than
    // asking the backend for counts it doesn't expose.
    size: 200,
  });

  // Don't surface your own stock while shopping — sellerId is the seller
  // *profile* id, not the user id.
  const mySellerId = sellerProfile ? String(sellerProfile.id) : null;
  const listings = (data?.content ?? []).filter(
    (l) => !mySellerId || String(l.sellerId) !== mySellerId
  );

  // Counts come from what's actually listed, so an empty category reads "0
  // deals" rather than pretending to have stock.
  const countFor = (name: Category) =>
    listings.filter((l) => l.category === name).length;

  const handleListingPress = (listing: ListingSummary) => {
    Keyboard.dismiss();
    router.push({
      pathname: '/(buyer)/(tabs)/listing/[id]',
      params: { id: String(listing.id) },
    });
  };

  // Dismiss the keyboard whenever this screen loses focus — switching tabs,
  // pushing a listing, or going back should never leave it hanging open.
  useFocusEffect(
    useCallback(() => {
      return () => {
        Keyboard.dismiss();
      };
    }, [])
  );

  return (
    // Only the top edge is inset — padding the bottom too would leave a green
    // band above the tab bar.
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.brandGreen }]}
      edges={['top']}
    >
      <BrandHeader
        title="Search Deals"
        search={{
          value: search,
          onChangeText: setSearch,
          placeholder: 'Search goods, sellers, categories...',
        }}
      />

      <View style={[styles.content, { backgroundColor: colors.background }]}>
        {isBrowsing ? (
          <ScrollView
            contentContainerStyle={styles.browse}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Browse by category
            </Text>

            <View style={styles.grid}>
              {CATEGORIES.map((name) => {
                const count = countFor(name);
                return (
                  <TouchableOpacity
                    key={name}
                    onPress={() => setCategory(name)}
                    activeOpacity={0.85}
                    style={[
                      styles.categoryCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderRadius: Radius.lg,
                        ...Shadow.sm,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: colors.secondary },
                      ]}
                    >
                      <Ionicons
                        name={CATEGORY_ICONS[name]}
                        size={18}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.categoryText}>
                      <Text
                        style={[styles.categoryName, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {name}
                      </Text>
                      <Text
                        style={[
                          styles.categoryCount,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {count} {count === 1 ? 'deal' : 'deals'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <>
            {/* Shows what's being filtered, and how to get back out of it. */}
            {!!category && (
              <View style={styles.activeRow}>
                <TouchableOpacity
                  onPress={() => setCategory(null)}
                  style={[
                    styles.activeChip,
                    { backgroundColor: colors.secondary, borderRadius: Radius.full },
                  ]}
                >
                  <Text style={[styles.activeChipText, { color: colors.primary }]}>
                    {category}
                  </Text>
                  <Ionicons name="close" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            <ListingGrid
              listings={listings}
              isLoading={isLoading}
              isError={isError}
              onRefresh={refetch}
              isRefreshing={isRefetching}
              onListingPress={handleListingPress}
              emptyTitle="No results found"
              emptySubtitle={
                category
                  ? `Nothing listed under ${category} right now`
                  : `No listings match "${search}"`
              }
              emptyIcon="search-outline"
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -8,
    overflow: 'hidden',
  },
  browse: {
    padding: Spacing.base,
    paddingBottom: Spacing['4xl'],
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryCard: {
    // Two per row, accounting for the gap between them.
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderWidth: 0.5,
  },
  categoryIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: { flex: 1 },
  categoryName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  categoryCount: {
    fontSize: FontSize.xs,
    marginTop: 1,
  },
  activeRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  activeChipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
