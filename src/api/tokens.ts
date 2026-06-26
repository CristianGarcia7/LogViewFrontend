// NOTE: Both tokens are stored in localStorage and are XSS-exposed.
// Future hardening: use httpOnly cookies with a /auth/refresh endpoint.
export const ACCESS_TOKEN_KEY = 'logview_token';    // kept for backward compat
export const REFRESH_TOKEN_KEY = 'logview_refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
