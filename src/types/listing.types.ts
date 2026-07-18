import type { ListingStatus, VerificationStatus } from '@/constants/app';
import type { Category } from '@/constants/categories';

// Matches the backend's ListingResponse DTO exactly — used for both the
// list endpoint and the single-listing endpoint, which return the same
// flat shape (no nested seller object, no image objects).
export interface ListingSummary {
  id: number;
  sellerId: number;
  /** The seller's *user* id — what ratings and reviews are keyed by. */
  sellerUserId?: number | null;
  sellerBusinessName: string;
  /** The seller's photo — absent if they haven't set one. */
  sellerProfileImageUrl?: string | null;
  productName: string;
  category: Category;
  description: string;
  quantity: number;
  unitOfMeasurement: string | null;
  originalPrice: number;
  currentPrice: number;
  expirySensitive: boolean;
  expiryDate: string | null;
  clearanceEndDate: string;
  discountStepPercent: number | null;
  discountIntervalDays: number | null;
  manualDiscountPercent: number | null;
  minimumAcceptablePrice: number;
  listingStatus: ListingStatus;
  urgencyScore: number;
  isHighUrgency: boolean;
  discountActive: boolean;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Listing extends ListingSummary {}

export interface CreateListingRequest {
  productName: string;
  category: Category;
  description: string;
  quantity: number;
  unitOfMeasurement: string | null;
  originalPrice: number;
  minimumAcceptablePrice: number;
  expirySensitive: boolean;
  expiryDate: string | null;
  clearanceEndDate: string;
  discountStepPercent: number | null;
  discountIntervalDays: number | null;
  images: string[];
}

export interface UpdateListingRequest {
  productName?: string;
  category?: Category;
  description?: string;
  quantity?: number;
  unitOfMeasurement?: string | null;
  originalPrice?: number;
  minimumAcceptablePrice?: number;
  expirySensitive?: boolean;
  expiryDate?: string | null;
  clearanceEndDate?: string;
  discountStepPercent?: number | null;
  discountIntervalDays?: number | null;
  images?: string[];
}

export interface ListingFilters {
  search?: string;
  category?: Category;
  region?: string;
  cityTown?: string;
  minPrice?: number;
  maxPrice?: number;
  verificationStatus?: VerificationStatus;
  page?: number;
  size?: number;
}

export interface PaginatedListings {
  content: ListingSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}