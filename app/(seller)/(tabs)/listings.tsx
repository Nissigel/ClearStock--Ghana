import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import {
  getMyListings,
  archiveListing,
  repostListing,
  permanentlyDeleteListing,
} from '@/api/listing.api';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';
import { CURRENCY_SYMBOL } from '@/constants/app';
import type { ListingSummary } from '@/types/listing.types';

type ListingFilter = 'ACTIVE' | 'ARCHIVED';

export default function SellerListingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const [filter, setFilter] = useState<ListingFilter>('ACTIVE');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-listings'],
    queryFn: getMyListings,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    queryClient.invalidateQueries({ queryKey: ['seller-listings'] });
  };

  const { mutate: deleteListing } = useMutation({
    mutationFn: (id: string) => archiveListing(id),
    onSuccess: invalidate,
    onError: (err) => {
      const message =
        (err as AxiosError<{ message?: string }>).response?.data?.message ??
        'Could not archive the listing. Please try again.';
      Alert.alert('Error', message);
    },
  });

  const { mutate: repost } = useMutation({
    mutationFn: (id: string) => repostListing(id),
    onSuccess: invalidate,
    onError: () => Alert.alert('Error', 'Could not repost the listing.'),
  });

  const { mutate: permanentlyDelete } = useMutation({
    mutationFn: (id: string) => permanentlyDeleteListing(id),
    onSuccess: invalidate,
    onError: (err) => {
      const message =
        (err as AxiosError<{ message?: string }>).response?.data?.message ??
        'Could not delete the listing.';
      Alert.alert('Error', message);
    },
  });

  const confirmDelete = (listing: ListingSummary) => {
    Alert.alert(
      'Archive Listing',
      `Move "${listing.productName}" to Archived? You can repost or permanently delete it later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => deleteListing(String(listing.id)),
        },
      ]
    );
  };

  const confirmRepost = (listing: ListingSummary) => {
    Alert.alert(
      'Repost Listing',
      `Put "${listing.productName}" back on the marketplace?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Repost', onPress: () => repost(String(listing.id)) },
      ]
    );
  };

  const confirmPermanentDelete = (listing: ListingSummary) => {
    Alert.alert(
      'Delete Permanently',
      `Permanently delete "${listing.productName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => permanentlyDelete(String(listing.id)),
        },
      ]
    );
  };

  const listings = data ?? [];
  const shownListings =
    filter === 'ARCHIVED'
      ? listings.filter((l) => l.listingStatus === 'ARCHIVED')
      : listings.filter((l) => l.listingStatus !== 'ARCHIVED');
  const archivedCount = listings.filter(
    (l) => l.listingStatus === 'ARCHIVED'
  ).length;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'active';
      case 'OUT_OF_STOCK': return 'outOfStock';
      case 'EXPIRED': return 'expired';
      case 'ARCHIVED': return 'archived';
      default: return 'unverified';
    }
  };

  const renderItem = ({ item }: { item: ListingSummary }) => {
    const rawImageUrl = item.images[0];
    const primaryImageUrl =
      rawImageUrl && !rawImageUrl.startsWith('file://') && !failedImages[item.id]
        ? rawImageUrl
        : null;

    return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: Radius.lg,
          ...Shadow.sm,
        },
      ]}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        {primaryImageUrl ? (
          <Image
            source={{ uri: primaryImageUrl }}
            style={[styles.imagePlaceholder, { borderRadius: Radius.md }]}
            resizeMode="cover"
            onError={() =>
              setFailedImages((prev) => ({ ...prev, [item.id]: true }))
            }
          />
        ) : (
          <View
            style={[
              styles.imagePlaceholder,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Text
              style={[styles.placeholderText, { color: colors.primary }]}
            >
              {item.productName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.details}>
          <Text
            style={[styles.productName, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {item.productName}
          </Text>
          <Text
            style={[styles.category, { color: colors.mutedForeground }]}
          >
            {item.category}
          </Text>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.primary }]}>
              {CURRENCY_SYMBOL} {item.currentPrice.toFixed(2)}
            </Text>
            {item.currentPrice < item.originalPrice && (
              <Text
                style={[
                  styles.originalPrice,
                  { color: colors.mutedForeground },
                ]}
              >
                {CURRENCY_SYMBOL} {item.originalPrice.toFixed(2)}
              </Text>
            )}
          </View>
          <Badge
            variant={getStatusVariant(item.listingStatus) as any}
            label={item.listingStatus.replace('_', ' ')}
          />
        </View>

        {item.listingStatus === 'ARCHIVED' ? (
          <View style={styles.actionColumn}>
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => confirmRepost(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="refresh-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => confirmPermanentDelete(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={20} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionColumn}>
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() =>
                router.push({
                  pathname: '/(seller)/(screens)/create-listing',
                  params: { id: String(item.id) },
                })
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => confirmDelete(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={colors.destructive}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScreenHeader
        showBack={false}
        title="My Listings"
        rightElement={
          <TouchableOpacity
            onPress={() =>router.push({ pathname: '/(seller)/(screens)/create-listing' })}
            style={[
              styles.addButton,
              { backgroundColor: colors.primary },
            ]}
          >
            <Ionicons
              name="add"
              size={20}
              color={colors.primaryForeground}
            />
          </TouchableOpacity>
        }
      />

      {/* Active / Archived filter */}
      <View style={styles.filterRow}>
        {(['ACTIVE', 'ARCHIVED'] as ListingFilter[]).map((f) => {
          const isActive = filter === f;
          const label = f === 'ACTIVE' ? 'Active' : `Archived${archivedCount ? ` (${archivedCount})` : ''}`;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? colors.primary : colors.secondary,
                  borderRadius: Radius.full,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterLabel,
                  { color: isActive ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={shownListings}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            filter === 'ARCHIVED' ? (
              <EmptyState
                icon="archive-outline"
                title="No archived listings"
                subtitle="Listings you delete are moved here"
              />
            ) : (
              <EmptyState
                icon="cube-outline"
                title="No listings yet"
                subtitle="Create your first listing to start selling"
                actionLabel="Create Listing"
                onAction={() => router.push({ pathname: '/(seller)/(screens)/create-listing' })}
              />
            )
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs + 2,
  },
  filterLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  actionColumn: {
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  list: {
    padding: Spacing.base,
    gap: Spacing.md,
    paddingBottom: Spacing['4xl'],
  },
  card: {
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    opacity: 0.4,
  },
  details: {
    flex: 1,
    gap: Spacing.xs,
  },
  productName: {
    fontSize: FontSize.base,
    fontWeight: '600',
    lineHeight: 20,
  },
  category: {
    fontSize: FontSize.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  price: {
    fontSize: FontSize.base,
    fontWeight: '700',
  },
  originalPrice: {
    fontSize: FontSize.sm,
    textDecorationLine: 'line-through',
  },
  moreButton: {
    padding: Spacing.xs,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});