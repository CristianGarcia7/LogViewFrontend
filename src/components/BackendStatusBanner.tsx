import { useAuth } from '../context/AuthContext';
import { useBackendStatus } from '../context/BackendStatusContext';
import { Icon } from './Icon';
import './BackendStatusBanner.css';

export function BackendStatusBanner() {
  const { token, isLoading } = useAuth();
  const { isDown } = useBackendStatus();

  // Hide during auth bootstrap (avoid flash on login page) and for unauthenticated users.
  const isAuthenticated = !isLoading && token !== null;

  if (!isAuthenticated || !isDown) return null;

  return (
    <div className="backend-status-banner" role="alert" aria-live="assertive">
      <Icon name="alertTriangle" size={16} />
      Sin conexión con el servidor
    </div>
  );
}
