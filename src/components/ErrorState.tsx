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
      <p className="error-state__message">{message}</p>
      {onRetry && (
        <button
          type="button"
          className="error-state__retry"
          onClick={onRetry}
        >
          Retry
        </button>
      )}
    </div>
  );
}
