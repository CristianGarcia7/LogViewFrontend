import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { me } from '../api/auth';
import { TOKEN_KEY } from '../api/client';
import type { LoginUserDto } from '../api/types';

interface AuthContextValue {
  token: string | null;
  user: LoginUserDto | null;
  isLoading: boolean;
  login: (token: string, user: LoginUserDto) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY),
  );
  const [user, setUser] = useState<LoginUserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: if a token is stored, verify it by calling GET /auth/me
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    me()
      .then((userData) => {
        setToken(storedToken);
        setUser(userData);
      })
      .catch(() => {
        // Token invalid or expired — clear it
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback((newToken: string, newUser: LoginUserDto) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
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
