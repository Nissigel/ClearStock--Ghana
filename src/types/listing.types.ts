import type { ListingStatus, VerificationStatus } from '@/constants/app';
import type { Category } from '@/constants/categories';

export interface ListingImage {
  id: string;
  listingId: string;
  imageUrl: string | null;
  sortOrder: number;
}

export interface ListingSeller {
  id: string;
  userId: string;
  businessName: string | null;
  sellerType: string;
  marketHub: string;
  region: string;
  cityTown: string;
  verificationStatus: VerificationStatus;
  fullName: string;
  profilePhotoUrl: string | null;
}

export interface Listing {
  id: string;
  sellerId: string;
  productName: string;
  category: Category;
  description: string;
  quantity: number;
  unitOfMeasurement: string | null;
  originalPrice: number;
  currentPrice: number;
  minimumPrice: number;
  isExpirySensitive: boolean;
  expiryDate: string | null;
  clearanceEndDate: string;
  discountStepPercent: number | null;
  discountIntervalDays: number | null;
  lastDiscountAt: string | null;
  status: ListingStatus;
  images: ListingImage[];
  seller: ListingSeller;
  isSaved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListingSellerSummary {
  id: string;
  businessName: string | null;
  fullName: string;
  verificationStatus: VerificationStatus;
}

export interface ListingSummary {
  id: string;
  productName: string;
  category: Category;
  currentPrice: number;
  originalPrice: number;
  unitOfMeasurement: string | null;
  status: ListingStatus;
  primaryImageUrl: string | null;
  seller: ListingSellerSummary;
  isSaved: boolean;
  isExpirySensitive: boolean;
  expiryDate: string | null;
  clearanceEndDate: string;
  createdAt: string;
}

export interface CreateListingRequest {
  productName: string;
  category: Category;
  description: string;
  quantity: number;
  unitOfMeasurement: string | null;
  originalPrice: number;
  minimumPrice: number;
  isExpirySensitive: boolean;
  expiryDate: string | null;
  clearanceEndDate: string;
  discountStepPercent: number | null;
  discountIntervalDays: number | null;
  imageUrls: string[];
}

export interface UpdateListingRequest {
  productName?: string;
  category?: Category;
  description?: string;
  quantity?: number;
  unitOfMeasurement?: string | null;
  originalPrice?: number;
  minimumPrice?: number;
  isExpirySensitive?: boolean;
  expiryDate?: string | null;
  clearanceEndDate?: string;
  discountStepPercent?: number | null;
  discountIntervalDays?: number | null;
  imageUrls?: string[];
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