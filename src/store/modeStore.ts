import { create } from 'zustand';
import type { UserMode } from '@/constants/app';
import { USER_MODE } from '@/constants/app';

interface ModeState {
  currentMode: UserMode;

  // Actions
  switchToBuyer: () => void;
  switchToSeller: () => void;
  reset: () => void;
}

export const useModeStore = create<ModeState>((set) => ({
  currentMode: USER_MODE.BUYER,

  switchToBuyer: () =>
    set({ currentMode: USER_MODE.BUYER }),

  switchToSeller: () =>
    set({ currentMode: USER_MODE.SELLER }),

  reset: () =>
    set({
      currentMode: USER_MODE.BUYER,
    }),
}));