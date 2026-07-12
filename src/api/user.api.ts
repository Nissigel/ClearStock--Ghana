import ENV from '@/config/env';
import apiClient from '@/api/client';
import { mapRawUser } from '@/api/auth.api';
import type { AuthUser } from '@/types/auth.types';
import type { UpdateProfileRequest } from '@/types/user.types';

export const updateProfile = async (
  data: UpdateProfileRequest
): Promise<AuthUser> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    throw new Error('Not available in mock mode.');
  }
  // Backend expects { name, email, profileImageUrl } and only updates the
  // fields that are present — the app's shape uses different names.
  const response = await apiClient.put('/user/profile', {
    name: data.fullName,
    email: data.email ?? undefined,
    profileImageUrl: data.profilePhotoUrl ?? undefined,
  });
  return mapRawUser(response.data.data);
};

export const updateEmail = async (email: string): Promise<AuthUser> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    throw new Error('Not available in mock mode.');
  }
  const response = await apiClient.put('/user/email', { email });
  return mapRawUser(response.data.data);
};

// The backend only supports a single "prefer email notifications" flag. Its
// current value is returned on the user profile (there is no GET
// /user/notifications), and PUT /user/notifications toggles it.
export const setEmailNotifications = async (
  preferEmail: boolean
): Promise<AuthUser> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    throw new Error('Not available in mock mode.');
  }
  const response = await apiClient.put('/user/notifications', { preferEmail });
  return mapRawUser(response.data.data);
};
