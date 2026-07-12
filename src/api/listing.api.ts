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

    // verificationStatus isn't present on ListingSummary (the backend
    // doesn't return it), so it can't be filtered client-side in mock mode.

    return {
      content: results,
      page: filters.page ?? 0,
      size: filters.size ?? 20,
      totalElements: results.length,
      totalPages: 1,
      hasNext: false,
    };
  }

  const response = await apiClient.get('/listings', {
    params: {
      search: filters.search,
      category: filters.category,
      region: filters.region,
      cityTown: filters.cityTown,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      verificationStatus: filters.verificationStatus,
    },
  });
  // Backend returns a plain array (List<ListingResponse>), not a
  // paginated object — wrap it into the shape screens expect.
  const listings = response.data.data as ListingSummary[];
  return {
    content: listings,
    page: 0,
    size: listings.length,
    totalElements: listings.length,
    totalPages: 1,
    hasNext: false,
  };
};

export const getUrgentListings = async (): Promise<ListingSummary[]> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_LISTINGS.filter((l) => l.expirySensitive);
  }
  const response = await apiClient.get('/listings/urgent');
  return response.data.data as ListingSummary[];
};

export const getListingById = async (id: string): Promise<Listing> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { ...MOCK_LISTING_DETAIL, id: Number(id) };
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
      id: Date.now(),
      productName: data.productName,
      category: data.category,
      description: data.description,
      quantity: data.quantity,
      originalPrice: data.originalPrice,
      currentPrice: data.originalPrice,
      minimumAcceptablePrice: data.minimumAcceptablePrice,
      expirySensitive: data.expirySensitive,
      images: data.images,
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
    return { ...MOCK_LISTING_DETAIL, id: Number(id), ...data };
  }
  const response = await apiClient.put(`/listings/${id}`, data);
  return response.data.data as Listing;
};

export const archiveListing = async (id: string): Promise<void> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return;
  }
  await apiClient.delete(`/listings/${id}`);
};

// Un-archive an archived listing, putting it back on the marketplace.
export const repostListing = async (id: string): Promise<Listing> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_LISTING_DETAIL;
  }
  const response = await apiClient.put(`/listings/${id}/repost`, {});
  return response.data.data as Listing;
};

// Permanently remove an archived listing (only when it has no order history).
export const permanentlyDeleteListing = async (id: string): Promise<void> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return;
  }
  await apiClient.delete(`/listings/${id}/permanent`);
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
    return MOCK_LISTINGS.slice(0, 2);
  }
  // Backend wraps each entry as { id, listing, savedAt } rather than
  // returning listings directly — unwrap.
  const response = await apiClient.get('/saved-listings');
  const saved = response.data.data as { listing: ListingSummary }[];
  return saved.map(({ listing }) => listing);
};