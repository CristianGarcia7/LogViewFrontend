import { Icon } from './Icon';
import './ErrorState.css';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="error-state" role="alert">
      <span className="error-state__icon">
        <Icon name="alertTriangle" size={32} />
      </span>
      <p className="error-state__message">{message}</p>
      {onRetry && (
        <button type="button" className="error-state__retry" onClick={onRetry}>
          <Icon name="refresh" size={16} />
          Retry
        </button>
      )}
    </div>
  );
}
