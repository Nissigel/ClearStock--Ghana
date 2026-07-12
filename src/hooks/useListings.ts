import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getListings,
  getUrgentListings,
  saveListing,
  unsaveListing,
} from '@/api/listing.api';
import { useListingFilterStore } from '@/store/listingFilterStore';
import type { ListingFilters } from '@/types/listing.types';

export const LISTINGS_KEY = 'listings';
export const URGENT_LISTINGS_KEY = 'urgent-listings';

export const useListings = (filters?: ListingFilters) => {
  const storeFilters = useListingFilterStore((state) => state.filters);
  const activeFilters = filters ?? storeFilters;

  return useQuery({
    queryKey: [LISTINGS_KEY, activeFilters],
    queryFn: () => getListings(activeFilters),
  });
};

export const useUrgentListings = () => {
  return useQuery({
    queryKey: [URGENT_LISTINGS_KEY],
    queryFn: getUrgentListings,
  });
};

export const useSaveListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listingId, isSaved }: { listingId: string; isSaved: boolean }) =>
      isSaved ? unsaveListing(listingId) : saveListing(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LISTINGS_KEY] });
    },
  });
};