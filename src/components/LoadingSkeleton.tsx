import './LoadingSkeleton.css';

interface LoadingSkeletonProps {
  /** Number of skeleton cards to render */
  count?: number;
}

export function LoadingSkeleton({ count = 8 }: LoadingSkeletonProps) {
  return (
    <div className="skeleton-grid" role="status" aria-label="Loading content">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-line skeleton-line--title" />
          <div className="skeleton-line skeleton-line--subtitle" />
          <div className="skeleton-line skeleton-line--meta" />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
