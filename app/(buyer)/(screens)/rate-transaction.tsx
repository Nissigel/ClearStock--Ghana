import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { KeyboardAvoidingWrapper } from '@/components/ui/KeyboardAvoidingWrapper';
import { Button } from '@/components/ui/Button';
import { StarRating } from '@/components/ui/StarRating';
import { createReview } from '@/api/review.api';
import { FontSize, FontFamily, Spacing, Radius } from '@/constants/theme';

export default function RateTransactionScreen() {
  const { transactionId, sellerId, sellerName } = useLocalSearchParams<{
    transactionId: string;
    sellerId: string;
    sellerName: string;
  }>();
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const { mutate: submitReview, isPending } = useMutation({
    mutationFn: () =>
      createReview({
        transactionId,
        sellerId,
        rating,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      // Refresh the order so the rate button gives way to the "reviewed"
      // note, and the seller's rating picks up the new score.
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] });
      queryClient.invalidateQueries({ queryKey: ['buyer-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['seller-reviews', sellerId] });
      queryClient.invalidateQueries({ queryKey: ['seller-rating', sellerId] });
      Alert.alert(
        'Review Submitted',
        'Thank you for your feedback!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    },
    onError: () => {
      setError('Failed to submit review. Please try again.');
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    setError('');
    submitReview();
  };

  const getRatingLabel = () => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Tap to rate';
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScreenHeader showBack title="Rate Seller" />
      <KeyboardAvoidingWrapper containerStyle={styles.content}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: Radius.lg,
            },
          ]}
        >
          <Text style={[styles.sellerName, { color: colors.foreground }]}>
            {sellerName}
          </Text>
          <Text
            style={[styles.question, { color: colors.mutedForeground }]}
          >
            How was your experience with this seller?
          </Text>

          <StarRating
            rating={rating}
            size={40}
            interactive
            onRate={setRating}
            containerStyle={styles.stars}
          />

          <Text style={[styles.ratingLabel, { color: colors.primary }]}>
            {getRatingLabel()}
          </Text>
        </View>

        <View
          style={[
            styles.commentCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: Radius.lg,
            },
          ]}
        >
          <Text style={[styles.commentLabel, { color: colors.foreground }]}>
            Add a comment (Optional)
          </Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Share your experience..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            maxLength={500}
            style={[
              styles.commentInput,
              {
                color: colors.foreground,
                borderColor: colors.input,
                borderRadius: Radius.md,
                fontFamily: FontFamily.regular,
              },
            ]}
          />
        </View>

        {error ? (
          <Text style={[styles.error, { color: colors.destructive }]}>
            {error}
          </Text>
        ) : null}

        <Button
          label="Submit Review"
          onPress={handleSubmit}
          loading={isPending}
          disabled={rating === 0}
        />

        <Button
          label="Skip"
          onPress={() => router.back()}
          variant="ghost"
        />
      </KeyboardAvoidingWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  card: {
    padding: Spacing.xl,
    borderWidth: 0.5,
    alignItems: 'center',
  },
  sellerName: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  question: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  stars: {
    marginBottom: Spacing.md,
  },
  ratingLabel: {
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  commentCard: {
    padding: Spacing.base,
    borderWidth: 0.5,
  },
  commentLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  commentInput: {
    borderWidth: 1.5,
    padding: Spacing.md,
    fontSize: FontSize.base,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
});