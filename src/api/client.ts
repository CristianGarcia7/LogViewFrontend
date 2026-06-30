import axios from 'axios';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from './tokens';
import { networkErrorNotifier } from '../context/BackendStatusContext';

// NOTE: Both the access token and the refresh token are stored in localStorage
// and are XSS-exposed. Future hardening: use httpOnly cookies with a server-side
// /auth/refresh endpoint so JS never touches the refresh token at all.

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------
// Refresh-queue state — module-level so all concurrent 401s share it
// ---------------------------------------------------------------
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: Error | null, token: string | null): void {
  for (const prom of failedQueue) {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  }
  failedQueue = [];
}

// ---------------------------------------------------------------
// Request interceptor — attach Bearer token when present
// ---------------------------------------------------------------
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------
// Response interceptor — silent token rotation on 401
// ---------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    if (!error.response) {
      networkErrorNotifier.current?.();
    }

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Refresh endpoint itself returned 401, or no refresh token available
    if (
      originalRequest.url?.includes('/auth/refresh') ||
      !getRefreshToken()
    ) {
      clearTokens();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Already retried once — give up
    if (originalRequest._retry) {
      clearTokens();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // Another request is already refreshing — queue this one
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      // Use raw axios (NOT apiClient) to avoid interceptor recursion
      const response = await axios.post<{
        accessToken: string;
        refreshToken: string;
      }>(`${BASE_URL}/auth/refresh`, { refreshToken: getRefreshToken() });

      const { accessToken, refreshToken } = response.data;
      setTokens(accessToken, refreshToken);
      processQueue(null, accessToken);
      originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (err) {
      const axiosErr = err as { response?: unknown };
      if (!axiosErr.response) {
        // Network error — backend is unreachable. Do NOT destroy the session.
        // The networkErrorNotifier already fired above (from the original request
        // or will fire from the refresh attempt reaching the outer interceptor).
        // Signal the banner and let the queued requests fail gracefully.
        networkErrorNotifier.current?.();
        processQueue(err as Error, null);
        return Promise.reject(err);
      }
      // Genuine auth failure (e.g. refresh token revoked/expired) — log out.
      processQueue(err as Error, null);
      clearTokens();
      window.location.href = '/login';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

// Re-export key for any legacy consumers; prefer importing from ./tokens directly
export { ACCESS_TOKEN_KEY as TOKEN_KEY } from './tokens';
export default apiClient;
