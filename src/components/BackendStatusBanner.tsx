import { useAuth } from '../context/AuthContext';
import { useBackendStatus } from '../context/BackendStatusContext';
import { Icon } from './Icon';
import './BackendStatusBanner.css';

export function BackendStatusBanner() {
  const { token, isLoading } = useAuth();
  const { isDown, isDegraded } = useBackendStatus();

  // Hide during auth bootstrap (avoid flash on login page) and for unauthenticated users.
  const isAuthenticated = !isLoading && token !== null;

  if (!isAuthenticated) return null;

  if (isDegraded) {
    return (
      <div
        className="backend-status-banner backend-status-banner--warn"
        role="alert"
        aria-live="polite"
      >
        <Icon name="alertTriangle" size={16} />
        Algunos servicios degradados — LogView operativo
      </div>
    );
  }

  if (isDown) {
    return (
      <div className="backend-status-banner" role="alert" aria-live="assertive">
        <Icon name="alertTriangle" size={16} />
        Sin conexión con el servidor
      </div>
    );
  }

  return null;
}
