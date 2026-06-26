import './EmptyState.css';

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({
  message = 'No items found.',
}: EmptyStateProps) {
  return (
    <div className="empty-state" role="status">
      <p className="empty-state__message">{message}</p>
    </div>
  );
}
