import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ListingGrid } from '@/components/ui/listing/ListingGrid';
import { useQuery } from '@tanstack/react-query';
import { getListings } from '@/api/listing.api';
import { FontSize, Spacing, Shadow } from '@/constants/theme';
import type { ListingSummary } from '@/types/listing.types';
import { StarRating } from '@/components/ui/StarRating';
import { getSellerReviews, getSellerRatingSummary } from '@/api/review.api';
import { Radius } from '@/constants/theme';


export default function SellerPublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['seller-listings', id],
    queryFn: () => getListings({ page: 0, size: 20 }),
  });

  const listings = data?.content ?? [];

  const handleListingPress = (listing: ListingSummary) => {
    router.push({
      pathname: '/(guest)/listing/[id]',
      params: { id: listing.id },
    });
  };

  const sellerName =
    listings[0]?.seller.businessName ??
    listings[0]?.seller.fullName ??
    'Seller';
  const verificationStatus =
    listings[0]?.seller.verificationStatus ?? 'UNVERIFIED';

const { data: reviews } = useQuery({
    queryKey: ['seller-reviews', id],
    queryFn: () => getSellerReviews(id),
  });

  const { data: ratingSummary } = useQuery({
    queryKey: ['seller-rating', id],
    queryFn: () => getSellerRatingSummary(id),
  });

  const SellerHeader = () => (
    <View>
      <View
        style={[
          styles.sellerCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            ...Shadow.sm,
          },
        ]}
      >
        <Avatar name={sellerName} size="xl" />
        <Text style={[styles.sellerName, { color: colors.foreground }]}>
          {sellerName}
        </Text>
        <View style={styles.badgeRow}>
          <Badge
            variant={
              verificationStatus === 'VERIFIED'
                ? 'verified'
                : verificationStatus === 'PENDING'
                ? 'pending'
                : 'unverified'
            }
          />
        </View>
        {ratingSummary && (
          <View style={styles.ratingRow}>
            <StarRating rating={ratingSummary.averageRating} size={16} />
            <Text style={[styles.ratingText, { color: colors.foreground }]}>
              {ratingSummary.averageRating.toFixed(1)} ({ratingSummary.totalReviews} reviews)
            </Text>
          </View>
        )}
      </View>

      {reviews && reviews.length > 0 && (
        <View style={styles.reviewsSection}>
          <Text style={[styles.reviewsTitle, { color: colors.foreground }]}>
            Reviews
          </Text>
          {reviews.slice(0, 3).map((review) => (
            <View
              key={review.id}
              style={[
                styles.reviewCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: Radius.md,
                },
              ]}
            >
              <View style={styles.reviewHeader}>
                <Avatar name={review.reviewerName} size="sm" />
                <View style={styles.reviewerInfo}>
                  <Text style={[styles.reviewerName, { color: colors.foreground }]}>
                    {review.reviewerName}
                  </Text>
                  <StarRating rating={review.rating} size={12} />
                </View>
                <Text style={[styles.reviewDate, { color: colors.mutedForeground }]}>
                  {new Date(review.createdAt).toLocaleDateString('en-GH', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
              </View>
              {review.comment && (
                <Text style={[styles.reviewComment, { color: colors.mutedForeground }]}>
                  {review.comment}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      <View style={styles.listingsSection}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Active Listings
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScreenHeader showBack title="Seller Profile" />

      <ListingGrid
        listings={listings}
        isLoading={isLoading}
        onListingPress={handleListingPress}
        emptyTitle="No active listings"
        emptySubtitle="This seller has no active listings at the moment"
        headerComponent={<SellerHeader />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  sellerCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderBottomWidth: 0.5,
  },
  sellerName: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  listingsSection: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  ratingText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  reviewsSection: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  reviewsTitle: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  reviewCard: {
    padding: Spacing.md,
    borderWidth: 0.5,
    marginBottom: Spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  reviewerInfo: { flex: 1 },
  reviewerName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  reviewDate: { fontSize: FontSize.xs },
  reviewComment: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
});