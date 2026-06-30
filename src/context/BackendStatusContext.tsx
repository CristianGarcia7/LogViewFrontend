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
}

const BackendStatusContext = createContext<BackendStatusContextValue | null>(
  null,
);

const POLL_HEALTHY_MS = 30_000;
const POLL_DOWN_MS = 10_000;

export function BackendStatusProvider({ children }: { children: ReactNode }) {
  const [isDown, setIsDown] = useState(false);

  // Expose the notifier so the axios interceptor can flip state on network error.
  useEffect(() => {
    networkErrorNotifier.current = () => setIsDown(true);
    return () => {
      networkErrorNotifier.current = null;
    };
  }, []);

  // Poll GET /health/ready. Restarts whenever `isDown` changes so the interval
  // switches between 30 s (healthy) and 10 s (down) without stale-closure bugs.
  useEffect(() => {
    const intervalMs = isDown ? POLL_DOWN_MS : POLL_HEALTHY_MS;

    const id = setInterval(async () => {
      try {
        await healthClient.get('/health/ready');
        setIsDown(false);
      } catch {
        setIsDown(true);
      }
    }, intervalMs);

    return () => clearInterval(id);
  }, [isDown]);

  return (
    <BackendStatusContext.Provider value={{ isDown }}>
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
