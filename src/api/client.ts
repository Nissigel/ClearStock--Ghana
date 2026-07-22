import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import ENV from '@/config/env';

const SECURE_STORE_KEYS = {
  TOKEN: 'clearstock_token',
} as const;

// Backend login/create-pin/reset-pin responses only ever include a single
// access token — there's no refresh token to store.
export const saveTokens = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(SECURE_STORE_KEYS.TOKEN, token);
};

export const getToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(SECURE_STORE_KEYS.TOKEN);
};

export const clearTokens = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.TOKEN);
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
    // Surface exactly which request failed (method, path, status) so failing
    // endpoints are obvious in the Metro logs instead of an opaque AxiosError.
    const method = (error.config?.method ?? 'get').toUpperCase();
    const url = error.config?.url ?? '(unknown url)';
    const status = error.response?.status ?? error.code ?? 'no-response';
    const body = error.response?.data;
    console.log(
      `[API ${status}] ${method} ${url}`,
      body ? JSON.stringify(body).slice(0, 300) : ''
    );

    if (error.response?.status === 401) {
      await clearTokens();
    }

    // Render's free tier cold-starts after idle: the first request often times
    // out or fails at the network layer while the server spins up. Retry once —
    // by then the backend is usually awake.
    const config = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const isColdStart =
      !error.response &&
      (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK');

    // A timeout only means we got no answer — not that nothing happened. The
    // server may well have completed the work, so only replay requests that are
    // safe to repeat. Re-sending a POST duplicates it, or collides with the
    // record it already created (e.g. sign-up returning "account exists").
    const isReplayable = ['GET', 'HEAD', 'OPTIONS'].includes(method);

    if (config && isColdStart && isReplayable && !config._retry) {
      config._retry = true;
      return apiClient(config);
    }

    return Promise.reject(error);
  }
);

// Fire-and-forget wake-up call, run at app launch so the Render backend is
// booting while the user reads the splash/onboarding. Any response — even a
// 404 — means the server is awake; errors are ignored.
export const warmUpBackend = async (): Promise<void> => {
  try {
    // Hit a public endpoint that returns 200 so the warm-up itself never
    // produces an error to reason about; it just wakes the server.
    await axios.get(`${ENV.API_BASE_URL}/listings`, { timeout: 60000 });
  } catch {
    // Ignored — real requests will retry once the server is up.
  }
};

export default apiClient;