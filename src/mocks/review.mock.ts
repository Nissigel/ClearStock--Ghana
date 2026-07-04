import type { Review, SellerRatingSummary } from '@/types/review.types';

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'review-001',
    transactionId: 'txn-002',
    reviewerId: 'user-001',
    reviewerName: 'Ama Mensah',
    reviewerPhotoUrl: null,
    sellerId: 'seller-004',
    rating: 5,
    comment: 'Great seller, products were exactly as described. Fast response.',
    createdAt: '2026-06-22T12:00:00Z',
  },
  {
    id: 'review-002',
    transactionId: 'txn-003',
    reviewerId: 'user-005',
    reviewerName: 'Kwame Asante',
    reviewerPhotoUrl: null,
    sellerId: 'seller-004',
    rating: 4,
    comment: 'Good quality products at fair prices. Would buy again.',
    createdAt: '2026-06-20T10:00:00Z',
  },
  {
    id: 'review-003',
    transactionId: 'txn-004',
    reviewerId: 'user-006',
    reviewerName: 'Abena Osei',
    reviewerPhotoUrl: null,
    sellerId: 'seller-004',
    rating: 5,
    comment: 'Excellent! Very professional seller.',
    createdAt: '2026-06-18T09:00:00Z',
  },
];

export const MOCK_SELLER_RATING: SellerRatingSummary = {
  averageRating: 4.7,
  totalReviews: 23,
  breakdown: { 5: 18, 4: 3, 3: 1, 2: 1, 1: 0 },
};