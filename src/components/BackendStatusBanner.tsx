import { useBackendStatus } from '../context/BackendStatusContext';
import { Icon } from './Icon';
import './BackendStatusBanner.css';

export function BackendStatusBanner() {
  const { isDown } = useBackendStatus();

  if (!isDown) return null;

  return (
    <div className="backend-status-banner" role="alert" aria-live="assertive">
      <Icon name="alertTriangle" size={16} />
      Sin conexión con el servidor
    </div>
  );
}
