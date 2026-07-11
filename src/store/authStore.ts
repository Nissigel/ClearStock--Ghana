import { create } from 'zustand';
import type { AuthUser } from '@/types/auth.types';
import type { SellerProfile } from '@/types/user.types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  hasSellerProfile: boolean;
  sellerProfile: SellerProfile | null;

  // Actions
  setAuth: (user: AuthUser, token: string) => void;
  setUser: (user: AuthUser) => void;
  setSellerProfile: (profile: SellerProfile | null) => void;
  setHasSellerProfile: (value: boolean) => void;
  clearAuth: () => void;
  setGuest: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isGuest: true,
  hasSellerProfile: false,
  sellerProfile: null,

  setAuth: (user, token) =>
    set({
      user,
      token,
      isAuthenticated: true,
      isGuest: false,
    }),

  setUser: (user) =>
    set({ user }),

  setSellerProfile: (profile) =>
    set({
      sellerProfile: profile,
      hasSellerProfile: profile !== null,
    }),

  setHasSellerProfile: (value) =>
    set({ hasSellerProfile: value }),

  clearAuth: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isGuest: true,
      hasSellerProfile: false,
      sellerProfile: null,
    }),

  setGuest: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isGuest: true,
      hasSellerProfile: false,
      sellerProfile: null,
    }),
}));