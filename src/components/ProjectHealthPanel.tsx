import { useCallback, useEffect, useState } from 'react';
import { getProjectHealth } from '../api/projects';
import type { HealthCheckResponseDto } from '../api/types';
import './ProjectHealthPanel.css';

// ---------------------------------------------------------------
// Liveness pill
// ---------------------------------------------------------------
function LivenessPill({ health }: { health: HealthCheckResponseDto }) {
  const { reachable, httpStatus, latencyMs, reason } = health;

  if (!reachable) {
    return (
      <span className="health-pill health-pill--error">
        DOWN{reason ? ` · ${reason}` : ''}
      </span>
    );
  }

  // reachable = true
  if (httpStatus !== null && httpStatus >= 400) {
    return (
      <span className="health-pill health-pill--warn">
        REACHABLE · {httpStatus}
      </span>
    );
  }

  // reachable + 2xx/3xx (or httpStatus null but reachable)
  const latencyLabel = latencyMs !== null ? ` · ${latencyMs}ms` : '';
  const statusLabel  = httpStatus !== null ? `${httpStatus}` : 'OK';
  return (
    <span className="health-pill health-pill--ok">
      UP · {statusLabel}{latencyLabel}
    </span>
  );
}

// ---------------------------------------------------------------
// SSL badge
// ---------------------------------------------------------------
function SslBadge({ health }: { health: HealthCheckResponseDto }) {
  const { ssl, secure } = health;

  if (ssl === null) {
    return <span className="health-badge health-badge--neutral">SSL: unknown</span>;
  }

  if (!secure || ssl.expired || !ssl.valid) {
    const label = ssl.expired
      ? `⚠ SSL EXPIRED ${Math.abs(ssl.daysUntilExpiry)} days ago — not secure`
      : '⚠ SSL invalid — not secure';
    return <span className="health-badge health-badge--error">{label}</span>;
  }

  // Valid and secure
  const badgeVariant = ssl.daysUntilExpiry < 14 ? 'health-badge--warn' : 'health-badge--ok';
  return (
    <span className={`health-badge ${badgeVariant}`}>
      🔒 SSL valid · expires in {ssl.daysUntilExpiry} days
    </span>
  );
}

// ---------------------------------------------------------------
// Panel
// ---------------------------------------------------------------
interface ProjectHealthPanelProps {
  projectId: string;
}

export function ProjectHealthPanel({ projectId }: ProjectHealthPanelProps) {
  const [health, setHealth]     = useState<HealthCheckResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState(false);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const data = await getProjectHealth(projectId);
      setHealth(data);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchHealth();
  }, [fetchHealth]);

  const checkedAtLabel = health?.checkedAt
    ? new Date(health.checkedAt).toLocaleTimeString()
    : null;

  return (
    <div className="health-panel" aria-label="Project health">
      {isLoading && (
        <span className="health-panel__loading" role="status">
          <span className="health-spinner" aria-hidden="true" />
          Checking health…
        </span>
      )}

      {!isLoading && error && (
        <span className="health-badge health-badge--neutral">Health unavailable</span>
      )}

      {!isLoading && !error && health && (
        <>
          <LivenessPill health={health} />
          <SslBadge health={health} />
          {checkedAtLabel && (
            <span className="health-panel__checked">checked {checkedAtLabel}</span>
          )}
        </>
      )}

      <button
        type="button"
        className="op-button-ghost health-panel__recheck"
        onClick={() => void fetchHealth()}
        disabled={isLoading}
        aria-label="Re-check project health"
      >
        {isLoading ? (
          <>
            <span className="health-spinner health-spinner--btn" aria-hidden="true" />
            Checking…
          </>
        ) : (
          'Re-check'
        )}
      </button>
    </div>
  );
}
