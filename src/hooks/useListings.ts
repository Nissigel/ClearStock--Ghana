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
export const SAVED_LISTINGS_KEY = 'savedListings';

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
    // Re-sync both lists with the server whether the toggle succeeded or failed.
    // The listing screen shows instant feedback locally in the meantime, so the
    // heart never has to wait on this round-trip.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [LISTINGS_KEY] });
      queryClient.invalidateQueries({ queryKey: [SAVED_LISTINGS_KEY] });
    },
  });
};