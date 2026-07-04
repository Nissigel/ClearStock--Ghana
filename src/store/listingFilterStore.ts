import { create } from 'zustand';
import type { ListingFilters } from '@/types/listing.types';

interface ListingFilterState {
  filters: ListingFilters;

  // Actions
  setFilter: (key: keyof ListingFilters, value: ListingFilters[keyof ListingFilters]) => void;
  setFilters: (filters: Partial<ListingFilters>) => void;
  clearFilters: () => void;
  clearFilter: (key: keyof ListingFilters) => void;
}

const DEFAULT_FILTERS: ListingFilters = {
  search: undefined,
  category: undefined,
  region: undefined,
  cityTown: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  verificationStatus: undefined,
  page: 0,
  size: 20,
};

export const useListingFilterStore = create<ListingFilterState>((set) => ({
  filters: DEFAULT_FILTERS,

  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
        page: 0,
      },
    })),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...newFilters,
        page: 0,
      },
    })),

  clearFilters: () =>
    set({ filters: DEFAULT_FILTERS }),

  clearFilter: (key) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: undefined,
        page: 0,
      },
    })),
}));