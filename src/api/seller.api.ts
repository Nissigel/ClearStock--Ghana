import type { AxiosError } from 'axios';
import ENV from '@/config/env';
import apiClient from '@/api/client';
import type { SellerProfile } from '@/types/user.types';

// Returns null when the user has no seller profile (backend responds 404 —
// this is a normal, expected outcome for buyer-only accounts, not an error).
export const getSellerProfile = async (): Promise<SellerProfile | null> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return null;
  }
  try {
    const response = await apiClient.get('/seller/profile');
    return response.data.data as SellerProfile;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 404) {
      return null;
    }
    throw error;
  }
};
