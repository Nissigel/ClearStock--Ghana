import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { getMyListings } from '@/api/listing.api';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';
import { CURRENCY_SYMBOL } from '@/constants/app';
import type { ListingSummary } from '@/types/listing.types';

export default function SellerListingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-listings'],
    queryFn: getMyListings,
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'active';
      case 'OUT_OF_STOCK': return 'outOfStock';
      case 'EXPIRED': return 'expired';
      case 'ARCHIVED': return 'archived';
      default: return 'unverified';
    }
  };

  const renderItem = ({ item }: { item: ListingSummary }) => (
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
              {CURRENCY_SYMBOL}{item.currentPrice.toFixed(2)}
            </Text>
            {item.currentPrice < item.originalPrice && (
              <Text
                style={[
                  styles.originalPrice,
                  { color: colors.mutedForeground },
                ]}
              >
                {CURRENCY_SYMBOL}{item.originalPrice.toFixed(2)}
              </Text>
            )}
          </View>
          <Badge
            variant={getStatusVariant(item.status) as any}
            label={item.status.replace('_', ' ')}
          />
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <Ionicons
            name="ellipsis-vertical"
            size={20}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScreenHeader
        showBack={false}
        title="My Listings"
        rightElement={
          <TouchableOpacity
            onPress={() =>router.push({ pathname: '/(seller)/create-listing' })}
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

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="cube-outline"
              title="No listings yet"
              subtitle="Create your first listing to start selling"
              actionLabel="Create Listing"
              onAction={() => router.push({ pathname: '/(seller)/create-listing' })}
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
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