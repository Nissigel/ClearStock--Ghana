import ENV from '@/config/env';
import apiClient from '@/api/client';
import { MOCK_REVIEWS, MOCK_SELLER_RATING } from '@/mocks/review.mock';
import type {
  Review,
  SellerRatingSummary,
  CreateReviewRequest,
} from '@/types/review.types';

export const getSellerReviews = async (sellerId: string): Promise<Review[]> => {
  if (ENV.USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    return MOCK_REVIEWS;
  }
  const response = await apiClient.get(`/sellers/${sellerId}/reviews`);
  return response.data.data as Review[];
};

export const getSellerRatingSummary = async (
  sellerId: string
): Promise<SellerRatingSummary> => {
  if (ENV.USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return MOCK_SELLER_RATING;
  }
  const response = await apiClient.get(`/sellers/${sellerId}/rating`);
  return response.data.data as SellerRatingSummary;
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