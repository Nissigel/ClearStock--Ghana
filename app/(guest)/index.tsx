import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { SearchBar } from '@/components/ui/SearchBar';
import { ClearStockLogo } from '@/components/ui/ClearStockLogo';
import { NotificationBell } from '@/components/ui/NotificationBell';
import {
  useListings,
  useSaveListing,
  useUrgentListings,
  SAVED_LISTINGS_KEY,
} from '@/hooks/useListings';
import { getSavedListings } from '@/api/listing.api';
import { useListingFilterStore } from '@/store/listingFilterStore';
import { useAuthStore } from '@/store/authStore';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';
import { CATEGORIES } from '@/constants/categories';
import type { ListingSummary } from '@/types/listing.types';
import type { Category } from '@/constants/categories';
import { Text } from '@/components/ui/Typography';
import { AuthPromptSheet } from '@/components/ui/AuthPromptSheet';
import { FilterSheet } from '@/components/ui/FilterSheet';
import { Image } from 'react-native';
import { CURRENCY_SYMBOL } from '@/constants/app';
import { Badge } from '@/components/ui/Badge';
import { SaleEndsCountdown } from '@/components/ui/SaleEndsCountdown';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.base * 2 - Spacing.sm) / 2;
const IMAGE_HEIGHT = CARD_WIDTH * 0.85;

export default function GuestHomeScreen() {
  const { colors, isDark, setColorScheme, colorScheme } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sellerProfile = useAuthStore((state) => state.sellerProfile);

  // This screen is rendered both at /(guest) (guest browsing, no tab bar)
  // and — via app/(buyer)/(tabs)/home.tsx re-exporting it — at /(buyer)/(tabs)/home
  // (inside the buyer tab navigator). Route to the matching group's
  // listing detail screen so buyers don't drop into the guest stack and
  // lose their tab bar.
  const listingDetailRoute =
    segments[0] === '(buyer)' ? '/(buyer)/(tabs)/listing/[id]' : '/(guest)/listing/[id]';

  const filters = useListingFilterStore((state) => state.filters);
  const setFilter = useListingFilterStore((state) => state.setFilter);
  const setFilters = useListingFilterStore((state) => state.setFilters);

  const { data, isLoading, isError, refetch, isRefetching } = useListings(filters);
  const { data: urgentListings = [] } = useUrgentListings();
  const { mutate: toggleSave } = useSaveListing();

  // Which listings this user has saved — powers the filled heart. Only fetched
  // when logged in (the endpoint requires auth).
  const { data: savedList = [] } = useQuery({
    queryKey: [SAVED_LISTINGS_KEY],
    queryFn: getSavedListings,
    enabled: isAuthenticated,
  });
  const savedIds = useMemo(
    () => new Set(savedList.map((l) => String(l.id))),
    [savedList]
  );

  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  const handleSearch = (text: string) => setFilter('search', text);

  const handleCategorySelect = (category: Category | null) => {
    setFilter('category', category ?? undefined);
  };

  const handleListingPress = (listing: ListingSummary) => {
    router.push({
      pathname: listingDetailRoute,
      params: { id: String(listing.id) },
    });
  };

  const handleSavePress = (listing: ListingSummary) => {
    if (!isAuthenticated) {
      setAuthPromptMessage('Login or register to save listings and get notified about price drops.');
      setShowAuthPrompt(true);
      return;
    }
    toggleSave({
      listingId: String(listing.id),
      isSaved: savedIds.has(String(listing.id)),
    });
  };

  const handleLoginPress = () => {
    router.push('/(auth)/login');
  };

  const toggleTheme = () => {
    setColorScheme(isDark ? 'light' : 'dark');
  };

  // Hide your own listings while browsing as a buyer — you can't buy your own
  // stock. sellerId on a listing is the seller *profile* id, not the user id.
  const mySellerId = sellerProfile ? String(sellerProfile.id) : null;
  const notMine = (l: ListingSummary) =>
    !mySellerId || String(l.sellerId) !== mySellerId;

  const listings = (data?.content ?? []).filter(notMine);
  const visibleUrgent = urgentListings.filter(notMine);

  const renderListingCard = ({ item }: { item: ListingSummary }) => {
    const isDiscounted = item.currentPrice < item.originalPrice;
    const discountPercent = isDiscounted
      ? Math.round(
          ((item.originalPrice - item.currentPrice) / item.originalPrice) * 100
        )
      : 0;

    const daysUntilExpiry = item.expiryDate
      ? Math.ceil(
          (new Date(item.expiryDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    const expiryLabel = item.expiryDate
      ? `Exp: ${new Date(item.expiryDate).toLocaleDateString('en-GH', { month: 'short', year: 'numeric' })}`
      : null;

    const rawImageUrl = item.images[0];
    const primaryImageUrl =
      rawImageUrl && !rawImageUrl.startsWith('file://') && !failedImages[item.id]
        ? rawImageUrl
        : null;

    return (
      <TouchableOpacity
        onPress={() => handleListingPress(item)}
        activeOpacity={0.85}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderRadius: Radius.lg,
            borderColor: colors.border,
            ...Shadow.sm,
          },
        ]}
      >
        {/* Image */}
        <View
          style={[
            styles.imageContainer,
            {
              backgroundColor: colors.secondary,
              borderTopLeftRadius: Radius.lg,
              borderTopRightRadius: Radius.lg,
              height: IMAGE_HEIGHT,
            },
          ]}
        >
          {primaryImageUrl ? (
            <Image
              source={{ uri: primaryImageUrl }}
              style={styles.image}
              resizeMode="cover"
              onError={() =>
                setFailedImages((prev) => ({ ...prev, [item.id]: true }))
              }
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text
                style={[styles.placeholderText, { color: colors.primary }]}
              >
                {item.productName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Discount badge top left */}
          {discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <View
                style={[
                  styles.discountPill,
                  { backgroundColor: colors.flame },
                ]}
              >
                <Text style={styles.discountText}>
                  🔥 {discountPercent}% OFF
                </Text>
              </View>
            </View>
          )}

          {/* Save button top right */}
          <TouchableOpacity
            onPress={() => handleSavePress(item)}
            style={styles.saveButton}
          >
            <View
              style={[styles.saveButtonBg, { backgroundColor: colors.card }]}
            >
              <Ionicons
                name={savedIds.has(String(item.id)) ? 'heart' : 'heart-outline'}
                size={16}
                color={
                  savedIds.has(String(item.id))
                    ? colors.destructive
                    : colors.mutedForeground
                }
              />
            </View>
          </TouchableOpacity>

          {/* Expiry date bottom left */}
          {expiryLabel && (
            <View style={styles.expiryTag}>
              <View
                style={[
                  styles.expiryPill,
                  // Fixed dark pill in both themes — it sits over a photo of any
                  // colour, so it must never follow the (light) surface colour.
                  { backgroundColor: 'rgba(0,0,0,0.8)' },
                ]}
              >
                <Ionicons name="time-outline" size={10} color="white" />
                <Text style={styles.expiryText}>{expiryLabel}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Details */}
        <View style={styles.cardDetails}>
          <Text
            style={[styles.productName, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {item.productName}
          </Text>

          <Text style={[styles.currentPrice, { color: colors.destructive }]}>
            {CURRENCY_SYMBOL} {item.currentPrice.toFixed(2)}
          </Text>

          {isDiscounted && (
            <Text
              style={[styles.originalPrice, { color: colors.mutedForeground }]}
            >
              {CURRENCY_SYMBOL}{item.originalPrice.toFixed(2)}
            </Text>
          )}

          {item.listingStatus === 'ACTIVE' && !!item.clearanceEndDate && (
            <SaleEndsCountdown
              endsAt={item.clearanceEndDate}
              compact
              style={styles.cardCountdown}
            />
          )}

          <View style={styles.sellerRow}>
            <Text
              style={[styles.sellerName, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {item.sellerBusinessName}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {/* GREEN HEADER SECTION */}
      <View style={[styles.headerSection, { backgroundColor: colors.background }]}>
        {/* Top Row — Logo + Login + Theme */}
        <View style={styles.topRow}>
          <View style={styles.logoRow}>
            <ClearStockLogo size={40} />
            <View>
              <Text style={[styles.appName, { color: colors.gold }]}>
                ClearStock
              </Text>
              <Text style={[styles.appRegion, { color: colors.gold }]}>
                GHANA
              </Text>
            </View>
          </View>

          <View style={styles.topActions}>
            {!isAuthenticated && (
              <TouchableOpacity
                onPress={handleLoginPress}
                style={[
                  styles.loginButton,
                  { backgroundColor: colors.gold },
                ]}
              >
                <Text style={[styles.loginButtonText, { color: colors.goldForeground }]}>
                  Login / Sign Up
                </Text>
              </TouchableOpacity>
            )}
            {/* Renders only once signed in — a guest has no notifications. */}
            <NotificationBell />
            <TouchableOpacity
              onPress={toggleTheme}
              style={[
                styles.themeButton,
                { backgroundColor: colors.secondary },
              ]}
            >
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={18}
                color={colors.foreground}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 0.5,
                borderRadius: Radius.lg,
              },
            ]}
          >
            <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
            <TouchableOpacity
              style={styles.searchInput}
              onPress={() => router.push('/(buyer)/(tabs)/search')}
            >
              <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
                Search goods, sellers...
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowFilter(true)}>
              <Ionicons name="options-outline" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          <TouchableOpacity
            onPress={() => handleCategorySelect(null)}
            style={[
              styles.chip,
              {
                backgroundColor: !filters.category ? colors.gold : colors.secondary,
                borderRadius: Radius.full,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: !filters.category ? colors.goldForeground : colors.mutedForeground,
                },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => handleCategorySelect(category)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    filters.category === category
                      ? colors.gold
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
                      filters.category === category
                        ? colors.goldForeground
                        : colors.mutedForeground,
                  },
                ]}
              >
                {category.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* WHITE CONTENT SECTION */}
      <View
        style={[
          styles.contentSection,
          { backgroundColor: colors.background },
        ]}
      >
        <FlatList
          data={listings}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListHeaderComponent={
            visibleUrgent.length > 0 ? (
              <TouchableOpacity
                style={[
                  styles.flashBanner,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.flame,
                    borderRadius: Radius.lg,
                  },
                ]}
              >
                <View style={styles.flashLeft}>
                  <Text style={styles.flashIcon}>🔥</Text>
                  <View>
                    <Text style={[styles.flashTitle, { color: colors.flame }]}>
                      Flash Deals Ending Soon!
                    </Text>
                    <Text style={[styles.flashSubtitle, { color: colors.mutedForeground }]}>
                      Grab these before they expire
                    </Text>
                  </View>
                </View>
                <Ionicons name="arrow-forward" size={18} color={colors.flame} />
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No listings found
                </Text>
              </View>
            ) : null
          }
          renderItem={renderListingCard}
        />
      </View>

      <AuthPromptSheet
        visible={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        message={authPromptMessage}
      />

      <FilterSheet
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        currentFilters={filters}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setShowFilter(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerSection: {
    paddingBottom: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  appName: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  appRegion: {
    fontSize: FontSize.xs,
    letterSpacing: 3,
    opacity: 0.85,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loginButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  loginButtonText: {
    fontSize: FontSize.xs,
    fontWeight: 'bold',
  },
  themeButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
  },
  searchInput: { flex: 1 },
  searchPlaceholder: { fontSize: FontSize.sm },
  categories: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  chipText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  contentSection: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -8,
    overflow: 'hidden',
  },
  listContent: {
    padding: Spacing.base,
    paddingBottom: Spacing['4xl'],
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  flashBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  flashLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  flashIcon: { fontSize: 20 },
  flashTitle: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
  },
  flashSubtitle: { fontSize: FontSize.xs },
  card: {
    width: CARD_WIDTH,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: FontSize['2xl'],
    fontWeight: 'bold',
    opacity: 0.4,
  },
  discountBadge: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
  },
  discountPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  discountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  saveButton: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
  },
  saveButtonBg: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
  expiryTag: {
    position: 'absolute',
    bottom: Spacing.xs,
    left: Spacing.xs,
  },
  expiryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 2,
  },
  expiryText: {
    fontSize: 9,
    color: 'white',
    fontWeight: '500',
    // A soft shadow keeps it legible even where the pill overlaps a bright
    // part of the photo.
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardDetails: {
    padding: Spacing.sm,
  },
  productName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 18,
  },
  currentPrice: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  originalPrice: {
    fontSize: FontSize.xs,
    textDecorationLine: 'line-through',
    marginBottom: Spacing.xs,
  },
  cardCountdown: {
    marginBottom: Spacing.xs,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  sellerName: {
    fontSize: FontSize.xs,
    flex: 1,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 2,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: Spacing['3xl'],
  },
  emptyText: { fontSize: FontSize.base },
});