import { create } from 'zustand';
import type { UserMode } from '@/constants/app';
import { USER_MODE } from '@/constants/app';

interface ModeState {
  currentMode: UserMode;
  hasSellerProfile: boolean;

  // Actions
  switchToBuyer: () => void;
  switchToSeller: () => void;
  setHasSellerProfile: (value: boolean) => void;
  reset: () => void;
}

export const useModeStore = create<ModeState>((set) => ({
  currentMode: USER_MODE.BUYER,
  hasSellerProfile: false,

  switchToBuyer: () =>
    set({ currentMode: USER_MODE.BUYER }),

  switchToSeller: () =>
    set({ currentMode: USER_MODE.SELLER }),

  setHasSellerProfile: (value) =>
    set({ hasSellerProfile: value }),

  reset: () =>
    set({
      currentMode: USER_MODE.BUYER,
      hasSellerProfile: false,
    }),
}));