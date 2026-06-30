import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { login as loginApi, logout as logoutApi, me } from '../api/auth';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '../api/tokens';
import type { LoginUserDto } from '../api/types';
import { useBackendStatus } from './BackendStatusContext';

interface AuthContextValue {
  /** Kept for ProtectedRoute compatibility — derived from localStorage. */
  token: string | null;
  user: LoginUserDto | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAccessToken());
  const [user, setUser] = useState<LoginUserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isDown } = useBackendStatus();
  // Track the previous isDown value so we can detect the true → false recovery edge.
  const prevIsDownRef = useRef<boolean>(isDown);

  // On mount: if an access token is stored, verify it by calling GET /auth/me
  useEffect(() => {
    const storedToken = getAccessToken();
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    me()
      .then((userData) => {
        setToken(getAccessToken()); // may have been rotated by interceptor
        setUser(userData);
      })
      .catch((error: unknown) => {
        const axiosErr = error as { response?: unknown };
        if (!axiosErr.response) {
          // Network error on mount — backend is unreachable but the stored
          // tokens are still valid. Keep the session intact; the backend
          // status banner will surface the outage to the user.
          setToken(getAccessToken());
          // Leave user as null — it will be populated once backend recovers.
          return;
        }
        // Genuine auth failure (401) — interceptor already cleared tokens.
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Recovery effect: when the backend transitions from down → healthy, re-fetch
  // the user if a token is present but user is still null (i.e. the initial
  // me() call failed with a network error during an outage).
  useEffect(() => {
    const wasDown = prevIsDownRef.current;
    prevIsDownRef.current = isDown;

    // Only act on the true → false edge (recovery).
    if (!wasDown || isDown) return;

    const storedToken = getAccessToken();
    if (!storedToken || user !== null) return;

    me()
      .then((userData) => {
        setToken(getAccessToken()); // may have been rotated by interceptor
        setUser(userData);
      })
      .catch((error: unknown) => {
        const axiosErr = error as { response?: unknown };
        if (!axiosErr.response) {
          // Still a network error — backend not fully up yet. Do nothing;
          // wait for the next recovery edge.
          return;
        }
        // Real HTTP failure (e.g. 401) — the token is invalid. Clear session.
        setToken(null);
        setUser(null);
      });
  }, [isDown, user]);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const { accessToken, refreshToken } = await loginApi(email, password);
      setTokens(accessToken, refreshToken);
      const userData = await me();
      setToken(accessToken);
      setUser(userData);
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await logoutApi(refreshToken);
      } catch {
        // Best-effort — clear locally regardless
      }
    }
    clearTokens();
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
