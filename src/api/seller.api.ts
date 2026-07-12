import type { AxiosError } from 'axios';
import ENV from '@/config/env';
import apiClient from '@/api/client';
import type {
  SellerProfile,
  BecomeSellerRequest,
  UpdateSellerProfileRequest,
  RecoveryDashboard,
} from '@/types/user.types';

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

export const becomeSeller = async (
  data: BecomeSellerRequest
): Promise<SellerProfile> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      id: `seller-${Date.now()}`,
      userId: 'user-001',
      sellerType: data.sellerType,
      businessName: data.businessName ?? null,
      marketHub: data.marketHub,
      businessDescription: data.businessDescription,
      verificationStatus: 'UNVERIFIED',
      ghanaCardNumber: null,
      ghanaCardPhotoUrl: null,
      businessRegUrl: null,
      rejectionReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  // The backend SellerType enum is only INDIVIDUAL | BUSINESS, so collapse the
  // app's richer list down to one of those two valid values.
  const sellerType =
    data.sellerType === 'Individual Seller' ? 'INDIVIDUAL' : 'BUSINESS';
  const response = await apiClient.post('/seller/become', {
    ...data,
    sellerType,
  });
  return response.data.data as SellerProfile;
};

export const updateSellerProfile = async (
  data: UpdateSellerProfileRequest
): Promise<SellerProfile> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    throw new Error('Not available in mock mode.');
  }
  const response = await apiClient.put('/seller/profile', data);
  return response.data.data as SellerProfile;
};

export const getRecoveryDashboard = async (): Promise<RecoveryDashboard> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      totalGhsRecovered: 12480,
      totalTransactionsCompleted: 126,
      goodsRescued: 126,
      estimatedGhsSavedFromWaste: 4992,
      buyersReached: 89,
      co2AvoidedKg: 500,
    };
  }
  const response = await apiClient.get('/seller/recovery-dashboard');
  return response.data.data as RecoveryDashboard;
};
