const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'https://clearstock-ghana.onrender.com';

const TOKEN_KEY = 'clearstock_admin_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/** The backend wraps every response in this envelope. */
type Envelope<T> = { success: boolean; message: string; data: T };

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const token = getToken();

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    // The backend sleeps on Render's free tier and takes up to a minute to
    // wake, so a network failure here is usually a cold start rather than a
    // real outage. Say so, instead of showing a bare "Failed to fetch".
    throw new ApiError(
      'Could not reach the server. It may be waking up — wait a moment and try again.',
      0
    );
  }

  let payload: Envelope<T> | null = null;
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    // A 401 anywhere except the login route means the token has gone stale,
    // so drop it and let the app fall back to sign-in. On the login route
    // itself a 401 just means the password was wrong — clearing a token there
    // would replace the real message with "your session has expired".
    if (response.status === 401 && !path.startsWith('/admin/auth/login')) {
      clearToken();
      throw new ApiError('Your session has expired. Please sign in again.', 401);
    }
    throw new ApiError(
      payload?.message ?? `Request failed (${response.status})`,
      response.status
    );
  }

  return payload!.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
};
