import { useCallback, useEffect, useState } from 'react';
import { getSystemHealth } from '../api/health';
import type { DependencyStatusDto, ReadinessDetailDto } from '../api/types';
import { ErrorState } from './ErrorState';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import './SystemHealthPanel.css';

// ---------------------------------------------------------------
// Status → presentation mapping
// ---------------------------------------------------------------
type OverallStatus = ReadinessDetailDto['status'];

const OVERALL_PRESENTATION: Record<
  OverallStatus,
  { label: string; variant: 'ok' | 'warn' | 'error'; icon: IconName }
> = {
  ok: { label: 'ONLINE', variant: 'ok', icon: 'checkCircle' },
  degraded: { label: 'DEGRADED', variant: 'warn', icon: 'alertTriangle' },
  down: { label: 'DOWN', variant: 'error', icon: 'alertCircle' },
};

const DEPENDENCY_LABELS = {
  database: 'PostgreSQL',
  aws: 'AWS SSM',
} as const;

type DependencyKey = keyof typeof DEPENDENCY_LABELS;

// ---------------------------------------------------------------
// Dependency row (inline, not exported)
// ---------------------------------------------------------------
function DependencyRow({
  label,
  dependency,
  overall,
}: {
  label: string;
  dependency: DependencyStatusDto;
  overall: OverallStatus;
}) {
  // Healthy dep is always "ok"; an unhealthy dep follows the overall severity:
  // warn while degraded, error while down.
  const variant = dependency.healthy
    ? 'ok'
    : overall === 'down'
      ? 'error'
      : 'warn';
  const pillText = dependency.healthy ? 'UP' : 'DOWN';

  return (
    <div className="system-health__row">
      <span className="system-health__row-label">{label}</span>
      <span className={`health-pill health-pill--${variant}`}>{pillText}</span>
      {dependency.reason && (
        <span className="system-health__row-reason">{dependency.reason}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// Panel
// ---------------------------------------------------------------
export function SystemHealthPanel() {
  const [detail, setDetail] = useState<ReadinessDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDetail = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const data = await getSystemHealth();
      setDetail(data);
    } catch {
      // A 503 (status === 'down') is an axios error and lands here too.
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  if (isLoading) {
    return (
      <div className="system-health" aria-label="System health">
        <span className="system-health__loading" role="status">
          <span className="health-spinner" aria-hidden="true" />
          Checking system status…
        </span>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="system-health" aria-label="System health">
        <ErrorState
          message="System status unavailable. Please retry."
          onRetry={() => void fetchDetail()}
        />
      </div>
    );
  }

  const presentation = OVERALL_PRESENTATION[detail.status];
  const checkedAtLabel = detail.checkedAt
    ? new Date(detail.checkedAt).toLocaleTimeString()
    : null;

  const dependencyKeys: DependencyKey[] = ['database', 'aws'];

  return (
    <div className="system-health" aria-label="System health">
      <div className="system-health__header">
        <span className={`health-badge health-badge--${presentation.variant}`}>
          <Icon name={presentation.icon} size={14} />
          {presentation.label}
        </span>
        {checkedAtLabel && (
          <span className="system-health__checked">
            checked {checkedAtLabel}
          </span>
        )}
        <button
          type="button"
          className="op-button-ghost system-health__recheck"
          onClick={() => void fetchDetail()}
          disabled={isLoading}
          aria-label="Re-check system status"
        >
          Re-check
        </button>
      </div>

      <div className="system-health__rows">
        {dependencyKeys.map((key) => (
          <DependencyRow
            key={key}
            label={DEPENDENCY_LABELS[key]}
            dependency={detail.checks[key]}
            overall={detail.status}
          />
        ))}
      </div>
    </div>
  );
}
