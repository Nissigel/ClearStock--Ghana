import ENV from '@/config/env';
import apiClient from '@/api/client';
import { MOCK_REVIEWS, MOCK_SELLER_RATING } from '@/mocks/review.mock';
import type {
  Review,
  SellerRatingSummary,
  CreateReviewRequest,
} from '@/types/review.types';

// `sellerId` here is the seller's userId — screens navigate to seller
// profiles using `listing.seller.userId`, which is what the reviews
// endpoint is keyed by.
export const getSellerReviews = async (sellerId: string): Promise<Review[]> => {
  if (ENV.USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    return MOCK_REVIEWS;
  }
  const response = await apiClient.get(`/reviews/user/${sellerId}`);
  return response.data.data as Review[];
};

export const getSellerRatingSummary = async (
  sellerId: string
): Promise<SellerRatingSummary> => {
  if (ENV.USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return MOCK_SELLER_RATING;
  }
  // Backend returns { sellerId, averageRating, reviewCount,
  // totalCompletedTransactions } — normalise to the app's shape (it uses
  // `totalReviews`, and there's no per-star breakdown from the backend).
  const response = await apiClient.get(`/seller/${sellerId}/rating`);
  const raw = response.data.data as {
    averageRating: number | null;
    reviewCount: number | null;
  };
  return {
    averageRating: raw.averageRating ?? 0,
    totalReviews: raw.reviewCount ?? 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  };
};

export const createReview = async (
  data: CreateReviewRequest
): Promise<Review> => {
  if (ENV.USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    const newReview: Review = {
      id: `review-${Date.now()}`,
      transactionId: data.transactionId,
      reviewerId: 'user-001',
      reviewerName: 'Ama Mensah',
      reviewerPhotoUrl: null,
      sellerId: data.sellerId,
      rating: data.rating,
      comment: data.comment ?? null,
      createdAt: new Date().toISOString(),
    };
    MOCK_REVIEWS.unshift(newReview);
    return newReview;
  }
  const response = await apiClient.post('/reviews', data);
  return response.data.data as Review;
};