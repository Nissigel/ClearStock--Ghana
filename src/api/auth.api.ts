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
  CreatePinRequest,
  LoginRequest,
  ResetPinRequest,
  AuthResponse,
  AuthUser,
} from '@/types/auth.types';

export const sendOtp = async (data: SendOtpRequest): Promise<void> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return;
  }
  await apiClient.post('/auth/send-otp', data);
};

export const verifyOtp = async (
  data: VerifyOtpRequest
): Promise<string> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (data.otp !== MOCK_OTP) {
      throw new Error('Invalid OTP. Please try again.');
    }
    return 'mock-temp-token';
  }
  const response = await apiClient.post('/auth/verify-otp', data);
  return response.data.data.tempToken;
};

export const createPin = async (
  data: CreatePinRequest
): Promise<AuthResponse> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await saveTokens(
      MOCK_AUTH_RESPONSE.token,
      MOCK_AUTH_RESPONSE.refreshToken
    );
    return MOCK_AUTH_RESPONSE;
  }
  const response = await apiClient.post('/auth/create-pin', data);
  const authData = response.data.data as AuthResponse;
  await saveTokens(authData.token, authData.refreshToken);
  return authData;
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (data.pin !== MOCK_PIN) {
      throw new Error('Incorrect PIN. Please try again.');
    }
    await saveTokens(
      MOCK_AUTH_RESPONSE.token,
      MOCK_AUTH_RESPONSE.refreshToken
    );
    return MOCK_AUTH_RESPONSE;
  }
  const response = await apiClient.post('/auth/login', data);
  const authData = response.data.data as AuthResponse;
  await saveTokens(authData.token, authData.refreshToken);
  return authData;
};

export const resetPin = async (
  data: ResetPinRequest
): Promise<AuthResponse> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await saveTokens(
      MOCK_AUTH_RESPONSE.token,
      MOCK_AUTH_RESPONSE.refreshToken
    );
    return MOCK_AUTH_RESPONSE;
  }
  const response = await apiClient.post('/auth/reset-pin', data);
  const authData = response.data.data as AuthResponse;
  await saveTokens(authData.token, authData.refreshToken);
  return authData;
};

export const logout = async (): Promise<void> => {
  await clearTokens();
};

export const getMyProfile = async (): Promise<AuthUser> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_AUTH_USER;
  }
  const response = await apiClient.get('/user/profile');
  return response.data.data as AuthUser;
};