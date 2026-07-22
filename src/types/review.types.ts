export interface Review {
  id: string;
  transactionId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerPhotoUrl: string | null;
  sellerId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface SellerRatingSummary {
  averageRating: number;
  totalReviews: number;
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface CreateReviewRequest {
  transactionId: string;
  sellerId: string;
  rating: number;
  comment?: string;
}