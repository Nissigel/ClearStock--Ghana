import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import ENV from '@/config/env';

const SECURE_STORE_KEYS = {
  TOKEN: 'clearstock_token',
  REFRESH_TOKEN: 'clearstock_refresh_token',
} as const;

export const saveTokens = async (
  token: string,
  refreshToken: string
): Promise<void> => {
  await SecureStore.setItemAsync(SECURE_STORE_KEYS.TOKEN, token);
  await SecureStore.setItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN, refreshToken);
};

export const getToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(SECURE_STORE_KEYS.TOKEN);
};

export const getRefreshToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
};

export const clearTokens = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.TOKEN);
  await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
};

const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await clearTokens();
    }
    return Promise.reject(error);
  }
);

export default apiClient;