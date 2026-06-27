import { Icon, type IconName } from './Icon';
import './EmptyState.css';

interface EmptyStateProps {
  message?: string;
  /** Icon shown above the message. Defaults to an inbox glyph. */
  icon?: IconName;
}

export function EmptyState({
  message = 'No items found.',
  icon = 'inbox',
}: EmptyStateProps) {
  return (
    <div className="empty-state" role="status">
      <span className="empty-state__icon">
        <Icon name={icon} size={32} />
      </span>
      <p className="empty-state__message">{message}</p>
    </div>
  );
}
