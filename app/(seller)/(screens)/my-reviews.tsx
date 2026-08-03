import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import { getSellerReviews, getSellerRatingSummary } from '@/api/review.api';
import { useAuthStore } from '@/store/authStore';
import { FontSize, Spacing, Radius } from '@/constants/theme';
import type { Review } from '@/types/review.types';

// Reviews are keyed by the seller's own user id — the same id the public shop
// and rating summary use.
export default function MyReviewsScreen() {
  const { colors } = useTheme();
  const userId = useAuthStore((state) => state.user?.id);
  const sellerId = userId ? String(userId) : '';

  const { data: reviews = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['seller-reviews', sellerId],
    queryFn: () => getSellerReviews(sellerId),
    enabled: !!sellerId,
  });

  const { data: summary } = useQuery({
    queryKey: ['seller-rating', sellerId],
    queryFn: () => getSellerRatingSummary(sellerId),
    enabled: !!sellerId,
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader showBack title="My Reviews" />
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onRefresh={refetch}
        refreshing={isRefetching}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          summary && summary.totalReviews > 0 ? (
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.summaryScore, { color: colors.foreground }]}>
                {summary.averageRating.toFixed(1)}
              </Text>
              <StarRating rating={summary.averageRating} size={18} />
              <Text style={[styles.summaryCount, { color: colors.mutedForeground }]}>
                Based on {summary.totalReviews} review
                {summary.totalReviews === 1 ? '' : 's'}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <ReviewRow review={item} colors={colors} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="star-outline"
              title="No reviews yet"
              subtitle="Reviews from buyers you've sold to will show up here."
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

interface ReviewRowProps {
  review: Review;
  colors: ReturnType<typeof useTheme>['colors'];
}

function ReviewRow({ review, colors }: ReviewRowProps) {
  return (
    <View
      style={[
        styles.reviewCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.reviewHeader}>
        <Avatar name={review.reviewerName} uri={review.reviewerPhotoUrl} size="sm" />
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
            year: 'numeric',
          })}
        </Text>
      </View>
      {review.comment ? (
        <Text style={[styles.reviewComment, { color: colors.mutedForeground }]}>
          {review.comment}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  listContent: {
    padding: Spacing.base,
    gap: Spacing.md,
    flexGrow: 1,
  },
  summaryCard: {
    alignItems: 'center',
    borderWidth: 0.5,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  summaryScore: {
    fontSize: FontSize['3xl'],
    fontWeight: 'bold',
  },
  summaryCount: {
    fontSize: FontSize.sm,
  },
  reviewCard: {
    borderWidth: 0.5,
    borderRadius: Radius.md,
    padding: Spacing.base,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  reviewerInfo: {
    flex: 1,
    gap: 2,
  },
  reviewerName: {
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  reviewDate: {
    fontSize: FontSize.xs,
  },
  reviewComment: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
});
