import { create } from 'zustand';
import type { Category } from '@/constants/categories';

interface CreateListingState {
  productName: string;
  category: Category | null;
  description: string;
  images: string[];
  quantity: string;
  unitOfMeasurement: string;
  originalPrice: string;
  minimumPrice: string;
  isExpirySensitive: boolean;
  expiryDate: string;
  clearanceEndDate: string;
  discountStepPercent: string;
  discountIntervalDays: string;

  // Actions
  setField: (key: string, value: string | boolean | string[] | Category | null) => void;
  addImage: (uri: string) => void;
  removeImage: (index: number) => void;
  reset: () => void;
}

const initialState = {
  productName: '',
  category: null as Category | null,
  description: '',
  images: [] as string[],
  quantity: '',
  unitOfMeasurement: '',
  originalPrice: '',
  minimumPrice: '',
  isExpirySensitive: false,
  expiryDate: '',
  clearanceEndDate: '',
  discountStepPercent: '',
  discountIntervalDays: '',
};

export const useCreateListingStore = create<CreateListingState>((set) => ({
  ...initialState,

  setField: (key, value) =>
    set((state) => ({ ...state, [key]: value })),

  addImage: (uri) =>
    set((state) => ({
      images: [...state.images, uri],
    })),

  removeImage: (index) =>
    set((state) => ({
      images: state.images.filter((_, i) => i !== index),
    })),

  reset: () => set({ ...initialState }),
}));