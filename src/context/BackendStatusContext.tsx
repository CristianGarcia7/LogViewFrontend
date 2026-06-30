import axios from 'axios';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// Side-channel so the axios response interceptor (non-React code) can signal
// a network error into React state without importing hooks.
export const networkErrorNotifier = { current: null as (() => void) | null };

// Dedicated axios instance for health polling — no bearer token, no 401 interceptor.
const healthClient = axios.create({ baseURL: BASE_URL });

interface BackendStatusContextValue {
  isDown: boolean;
  isDegraded: boolean;
}

const BackendStatusContext = createContext<BackendStatusContextValue | null>(
  null,
);

const POLL_HEALTHY_MS = 30_000;
const POLL_DOWN_MS = 10_000;

export function BackendStatusProvider({ children }: { children: ReactNode }) {
  // isDown and isDegraded are mutually exclusive — never both true.
  const [isDown, setIsDown] = useState(false);
  const [isDegraded, setIsDegraded] = useState(false);

  // Expose the notifier so the axios interceptor can flip state on network error.
  useEffect(() => {
    networkErrorNotifier.current = () => {
      setIsDown(true);
      setIsDegraded(false);
    };
    return () => {
      networkErrorNotifier.current = null;
    };
  }, []);

  // Poll GET /health/ready. Restarts whenever `isDown` changes so the interval
  // switches between 30 s (healthy) and 10 s (down) without stale-closure bugs.
  // The verdict body carries `status`: 'ok' | 'degraded' | 'down'.
  useEffect(() => {
    const intervalMs = isDown ? POLL_DOWN_MS : POLL_HEALTHY_MS;

    const id = setInterval(async () => {
      try {
        const response = await healthClient.get<{
          status?: 'ok' | 'degraded' | 'down';
        }>('/health/ready');
        const status = response.data?.status;
        if (status === 'down') {
          setIsDown(true);
          setIsDegraded(false);
        } else if (status === 'degraded') {
          setIsDown(false);
          setIsDegraded(true);
        } else {
          // 'ok' (or unknown/missing — treat as healthy)
          setIsDown(false);
          setIsDegraded(false);
        }
      } catch {
        // Network error or HTTP 503 (down) → axios rejects.
        setIsDown(true);
        setIsDegraded(false);
      }
    }, intervalMs);

    return () => clearInterval(id);
  }, [isDown]);

  return (
    <BackendStatusContext.Provider value={{ isDown, isDegraded }}>
      {children}
    </BackendStatusContext.Provider>
  );
}

export function useBackendStatus(): BackendStatusContextValue {
  const ctx = useContext(BackendStatusContext);
  if (!ctx) {
    throw new Error('useBackendStatus must be used inside <BackendStatusProvider>');
  }
  return ctx;
}
