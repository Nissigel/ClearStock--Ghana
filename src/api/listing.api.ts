import ENV from '@/config/env';
import apiClient from '@/api/client';
import {
  MOCK_LISTINGS,
  MOCK_LISTING_DETAIL,
} from '@/mocks/listing.mock';
import type {
  Listing,
  ListingSummary,
  CreateListingRequest,
  UpdateListingRequest,
  ListingFilters,
  PaginatedListings,
} from '@/types/listing.types';

export const getListings = async (
  filters: ListingFilters
): Promise<PaginatedListings> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));

    let results = [...MOCK_LISTINGS];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      results = results.filter((l) =>
        l.productName.toLowerCase().includes(search)
      );
    }

    if (filters.category) {
      results = results.filter((l) => l.category === filters.category);
    }

    if (filters.minPrice !== undefined) {
      results = results.filter((l) => l.currentPrice >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      results = results.filter((l) => l.currentPrice <= filters.maxPrice!);
    }

    if (filters.verificationStatus) {
      results = results.filter(
        (l) => l.seller.verificationStatus === filters.verificationStatus
      );
    }

    return {
      content: results,
      page: filters.page ?? 0,
      size: filters.size ?? 20,
      totalElements: results.length,
      totalPages: 1,
      hasNext: false,
    };
  }

  const response = await apiClient.get('/listings', { params: filters });
  return response.data.data as PaginatedListings;
};

export const getListingById = async (id: string): Promise<Listing> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { ...MOCK_LISTING_DETAIL, id };
  }
  const response = await apiClient.get(`/listings/${id}`);
  return response.data.data as Listing;
};

export const getMyListings = async (): Promise<ListingSummary[]> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_LISTINGS.slice(0, 3);
  }
  const response = await apiClient.get('/seller/listings');
  return response.data.data as ListingSummary[];
};

export const createListing = async (
  data: CreateListingRequest
): Promise<Listing> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      ...MOCK_LISTING_DETAIL,
      id: `listing-${Date.now()}`,
      productName: data.productName,
      category: data.category,
      description: data.description,
      quantity: data.quantity,
      originalPrice: data.originalPrice,
      currentPrice: data.originalPrice,
      minimumPrice: data.minimumPrice,
    };
  }
  const response = await apiClient.post('/listings', data);
  return response.data.data as Listing;
};

export const updateListing = async (
  id: string,
  data: UpdateListingRequest
): Promise<Listing> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { ...MOCK_LISTING_DETAIL, id, ...data };
  }
  const response = await apiClient.put(`/listings/${id}`, data);
  return response.data.data as Listing;
};

export const archiveListing = async (id: string): Promise<void> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return;
  }
  await apiClient.post(`/listings/${id}/archive`);
};

export const saveListing = async (listingId: string): Promise<void> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return;
  }
  await apiClient.post('/saved-listings', { listingId });
};

export const unsaveListing = async (listingId: string): Promise<void> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return;
  }
  await apiClient.delete(`/saved-listings/${listingId}`);
};

export const getSavedListings = async (): Promise<ListingSummary[]> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_LISTINGS.filter((l) => l.isSaved);
  }
  const response = await apiClient.get('/saved-listings');
  return response.data.data as ListingSummary[];
};