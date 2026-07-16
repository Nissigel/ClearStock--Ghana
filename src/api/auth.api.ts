import ENV from '@/config/env';
import apiClient, { saveTokens, clearTokens } from '@/api/client';
import {
  MOCK_AUTH_RESPONSE,
  MOCK_AUTH_USER,
  MOCK_OTP,
  MOCK_PIN,
} from '@/mocks/auth.mock';
import type {
  SendOtpRequest,
  VerifyOtpRequest,
  VerifyOtpResult,
  CreatePinRequest,
  LoginRequest,
  ResetPinRequest,
  AuthResponse,
  AuthUser,
} from '@/types/auth.types';

// Backend's login/create-pin/reset-pin responses (shared shape) are a flat
// { token, userId, phone, name } — no refreshToken, no role/isSeller, no
// nested user. Adapt it to the app's AuthResponse contract here so callers
// (store/screens) don't need to change.
interface RawAuthResponse {
  token: string;
  userId: number;
  phone: string;
  name: string;
}

const buildAuthResponse = async (
  raw: RawAuthResponse
): Promise<AuthResponse> => {
  await saveTokens(raw.token);
  const user = await getMyProfile();
  return { token: raw.token, user };
};

// The backend has no SMS gateway, so for a new sign-up it returns the OTP in
// the response body (otp is null only when it was emailed to an existing user
// who opted into email). Surface it so registration works with real numbers.
export const sendOtp = async (
  data: SendOtpRequest
): Promise<{ otp: string | null; emailSent: boolean }> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { otp: MOCK_OTP, emailSent: false };
  }
  const response = await apiClient.post('/auth/send-otp', data);
  const d = response.data.data as { otp: string | null; emailSent: boolean };
  return { otp: d?.otp ?? null, emailSent: !!d?.emailSent };
};

export const verifyOtp = async (
  data: VerifyOtpRequest
): Promise<VerifyOtpResult> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (data.otp !== MOCK_OTP) {
      throw new Error('Invalid OTP. Please try again.');
    }
    return { verified: true, userExists: false, tempToken: 'mock-temp-token' };
  }
  const response = await apiClient.post('/auth/verify-otp', data);
  const d = response.data.data as Partial<VerifyOtpResult>;
  // userExists matters: the backend returns a null tempToken for a phone that
  // already has an account, and the caller must route to login instead.
  return {
    verified: !!d?.verified,
    userExists: !!d?.userExists,
    tempToken: d?.tempToken ?? null,
  };
};

export const createPin = async (
  data: CreatePinRequest
): Promise<AuthResponse> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await saveTokens(MOCK_AUTH_RESPONSE.token);
    return MOCK_AUTH_RESPONSE;
  }
  const response = await apiClient.post('/auth/create-pin', data);
  return buildAuthResponse(response.data.data as RawAuthResponse);
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (data.pin !== MOCK_PIN) {
      throw new Error('Incorrect PIN. Please try again.');
    }
    await saveTokens(MOCK_AUTH_RESPONSE.token);
    return MOCK_AUTH_RESPONSE;
  }
  const response = await apiClient.post('/auth/login', data);
  return buildAuthResponse(response.data.data as RawAuthResponse);
};

export const resetPin = async (
  data: ResetPinRequest
): Promise<AuthResponse> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await saveTokens(MOCK_AUTH_RESPONSE.token);
    return MOCK_AUTH_RESPONSE;
  }
  const response = await apiClient.post('/auth/reset-pin', data);
  return buildAuthResponse(response.data.data as RawAuthResponse);
};

export const logout = async (): Promise<void> => {
  await clearTokens();
};

// Backend only returns { id, phone, name, email, profileImageUrl, createdAt } —
// there's no role/seller field at all. Seller status is derived separately
// via GET /seller/profile (see src/api/seller.api.ts) after login.
// region/cityTown/accountStatus are still genuinely absent from this
// response; left unset rather than guessed — see INTEGRATION-AUDIT.md.
export const mapRawUser = (raw: {
  id: number;
  phone: string;
  name: string;
  email: string | null;
  profileImageUrl: string | null;
  preferEmail?: boolean;
}): AuthUser => ({
  id: String(raw.id),
  fullName: raw.name,
  phoneNumber: raw.phone,
  email: raw.email ?? null,
  profilePhotoUrl: raw.profileImageUrl ?? null,
  emailNotifications: raw.preferEmail ?? true,
});

export const getMyProfile = async (): Promise<AuthUser> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_AUTH_USER;
  }
  const response = await apiClient.get('/user/profile');
  return mapRawUser(response.data.data);
};