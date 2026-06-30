import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getInstances, getSystemLogs } from '../api/systemLogs';
import type {
  InstanceDto,
  LogEntryDto,
  LogLevel,
  SystemLogsQueryParams,
  SystemLogType,
} from '../api/types';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Icon } from '../components/Icon';
import { LogStatsPanel } from '../components/LogStatsPanel';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import '../pages/LogViewPage.css';
import './SystemLogsPage.css';

// ---------------------------------------------------------------
// Local helpers — trimmed copies of LogViewPage's error-branch
// helpers. System logs always parse as error-format, so only that
// branch is needed here. LogViewPage's `LogLine` is a non-exported
// local function and is intentionally not imported/modified.
// ---------------------------------------------------------------
function getLevelClass(level?: string): string {
  switch (level?.toLowerCase()) {
    case 'error':  return 'badge--error';
    case 'warn':   return 'badge--warn';
    case 'notice': return 'badge--info';
    case 'info':   return 'badge--ok';
    default:       return 'badge--neutral';
  }
}

function formatLineTime(timestamp?: string): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString();
}

function SystemLogLine({
  entry,
  onCopy,
}: {
  entry: LogEntryDto;
  onCopy: (text: string) => void;
}) {
  const time = formatLineTime(entry.timestamp);

  return (
    <div className="log-line">
      {time && <span className="log-line__time">{time}</span>}
      {entry.level && (
        <span className={`badge ${getLevelClass(entry.level)}`}>
          {entry.level.toUpperCase()}
        </span>
      )}
      {entry.message ? (
        <span className="log-line__message">{entry.message}</span>
      ) : (
        <span className="log-line__raw">{entry.raw}</span>
      )}
      <button
        type="button"
        className="log-line__copy"
        onClick={() => onCopy(entry.raw)}
        aria-label="Copy this log line"
        title="Copy line"
      >
        <Icon name="copy" size={12} />
        Copy
      </button>
    </div>
  );
}

// ---------------------------------------------------------------
// Status-aware error message mapping
// ---------------------------------------------------------------
function getSystemLogErrorMessage(err: unknown): string {
  const status = (err as { response?: { status?: number } })?.response?.status;
  switch (status) {
    case 401:
      return 'Your session expired. Sign in again.';
    case 403:
      return 'You do not have access to system logs.';
    case 502:
      return 'The log command failed on the instance. Try again in a moment.';
    case 503:
      return 'The instance is unreachable or offline.';
    case 504:
      return 'Reading the logs timed out. Try fewer lines or retry.';
    default:
      return 'Failed to load system logs. Please retry.';
  }
}

// ---------------------------------------------------------------
// Page component — admin self-gate mirrors SystemStatusPage/UsersPage:
// the gate runs in an outer component with no other hooks so the
// inner content component can call hooks unconditionally.
// ---------------------------------------------------------------
export function SystemLogsPage() {
  const { user: currentUser } = useAuth();

  // Redirect non-admin users immediately (but not while auth is still loading).
  if (currentUser !== null && currentUser?.role !== 'admin') {
    return <Navigate to="/projects" replace />;
  }

  return <SystemLogsPageContent />;
}

function SystemLogsPageContent() {
  const { notify } = useToast();

  // ------ Instances phase (fetched once, on mount) ------
  const [instances, setInstances] = useState<InstanceDto[]>([]);
  const [instancesLoading, setInstancesLoading] = useState(true);
  const [instancesError, setInstancesError] = useState<string | null>(null);

  // ------ Filters ------
  const [selectedInstanceId, setSelectedInstanceId] = useState('');
  const [logType, setLogType] = useState<SystemLogType>('nginx');
  const [lastLines, setLastLines] = useState('200');
  const [textFilter, setTextFilter] = useState('');
  const [level, setLevel] = useState<LogLevel | ''>('');

  // ------ Logs phase (fetched ONLY on explicit button click) ------
  const [logs, setLogs] = useState<LogEntryDto[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [fetchedAt, setFetchedAt] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchInstances = useCallback(() => {
    setInstancesLoading(true);
    setInstancesError(null);
    getInstances()
      .then((data) => {
        setInstances(data);
        setSelectedInstanceId((current) => current || data[0]?.instanceId || '');
      })
      .catch((err: unknown) => setInstancesError(getSystemLogErrorMessage(err)))
      .finally(() => setInstancesLoading(false));
  }, []);

  // Fetch instances on mount only — NEVER auto-fetch /system-logs.
  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  const fetchLogs = useCallback(async () => {
    if (!selectedInstanceId) return;
    setLogsLoading(true);
    setLogsError(null);

    const params: SystemLogsQueryParams = {
      instanceId: selectedInstanceId,
      logType,
      ...(lastLines ? { lastLines: Number(lastLines) } : {}),
      ...(textFilter ? { text: textFilter } : {}),
      ...(level ? { level: level as LogLevel } : {}),
    };

    try {
      const data = await getSystemLogs(params);
      setLogs(data.lines);
      setTruncated(data.truncated);
      setFetchedAt(data.fetchedAt);
      setHasFetched(true);
    } catch (err) {
      setLogsError(getSystemLogErrorMessage(err));
    } finally {
      setLogsLoading(false);
    }
  }, [selectedInstanceId, logType, lastLines, textFilter, level]);

  const copyLine = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        notify('success', 'Line copied');
      } catch {
        notify('error', 'Could not copy to clipboard.');
      }
    },
    [notify],
  );

  const controlsDisabled = instancesLoading || !!instancesError || instances.length === 0;
  const formattedTime = fetchedAt ? new Date(fetchedAt).toLocaleTimeString() : '';
  const showInitialLoader = logsLoading && logs.length === 0;
  const isRefreshing = logsLoading && logs.length > 0;
  const showContent = hasFetched && !logsError && !logsLoading && logs.length > 0;

  return (
    <div className="logview-page">
      <AppHeader />

      <main className="logview-main">
        <h1 className="system-logs-page__title">
          <Icon name="activity" size={24} />
          System Logs
        </h1>

        {/* ------ Filter bar ------ */}
        <div className="logview-filters" role="search" aria-label="System log filters">
          {/* Instance */}
          <div className="filter-field filter-field--grow">
            <label className="filter-label" htmlFor="instanceId">Instance</label>
            <select
              id="instanceId"
              className="filter-input"
              value={selectedInstanceId}
              onChange={(e) => setSelectedInstanceId(e.target.value)}
              disabled={controlsDisabled}
            >
              {instances.length === 0 && <option value="">No instances</option>}
              {instances.map((instance) => (
                <option key={instance.instanceId} value={instance.instanceId}>
                  {instance.name ?? instance.computerName ?? instance.instanceId}
                </option>
              ))}
            </select>
          </div>

          {/* Log type */}
          <div className="filter-field">
            <label className="filter-label" htmlFor="systemLogType">Type</label>
            <select
              id="systemLogType"
              className="filter-input"
              value={logType}
              onChange={(e) => setLogType(e.target.value as SystemLogType)}
              disabled={controlsDisabled}
            >
              <option value="nginx">nginx</option>
              <option value="apache">apache</option>
            </select>
          </div>

          {/* Last lines */}
          <div className="filter-field">
            <label className="filter-label" htmlFor="systemLastLines">Lines</label>
            <input
              id="systemLastLines"
              className="filter-input filter-input--narrow"
              type="number"
              min={1}
              max={10000}
              value={lastLines}
              onChange={(e) => setLastLines(e.target.value)}
              placeholder="200"
              disabled={controlsDisabled}
            />
          </div>

          {/* Text search */}
          <div className="filter-field filter-field--grow">
            <label className="filter-label" htmlFor="systemTextFilter">Search</label>
            <input
              id="systemTextFilter"
              className="filter-input"
              type="search"
              value={textFilter}
              onChange={(e) => setTextFilter(e.target.value)}
              placeholder="Filter log text…"
              disabled={controlsDisabled}
            />
          </div>

          {/* Level */}
          <div className="filter-field">
            <label className="filter-label" htmlFor="systemLevel">Level</label>
            <select
              id="systemLevel"
              className="filter-input"
              value={level}
              onChange={(e) => setLevel(e.target.value as LogLevel | '')}
              disabled={controlsDisabled}
            >
              <option value="">All</option>
              <option value="error">Error</option>
              <option value="warn">Warn</option>
              <option value="notice">Notice</option>
              <option value="info">Info</option>
            </select>
          </div>

          {/* Fetch */}
          <div className="filter-field filter-field--action">
            <button
              type="button"
              className="logview-refresh"
              onClick={() => void fetchLogs()}
              disabled={controlsDisabled || !selectedInstanceId || logsLoading}
              aria-label={hasFetched ? 'Refresh logs' : 'View logs'}
            >
              <Icon name="refresh" size={16} />
              {logsLoading ? 'Loading…' : hasFetched ? 'Refresh' : 'View logs'}
            </button>
          </div>
        </div>

        {/* ------ Truncated warning ------ */}
        {truncated && (
          <div className="logview-truncated-banner" role="alert">
            Output truncated — reduce <strong>lastLines</strong> or add filters.
          </div>
        )}

        {/* ------ Stats overview (derived from loaded lines) ------ */}
        {showContent && <LogStatsPanel lines={logs} logType="error" />}

        {/* ------ Results toolbar ------ */}
        {(showContent || isRefreshing) && (
          <div className="logview-results">
            <div className="logview-results__left">
              <span className="logview-results__count">
                {isRefreshing && <Spinner size={14} label="Refreshing logs" />}
                {logs.length} {logs.length === 1 ? 'line' : 'lines'}
              </span>
              {fetchedAt && (
                <span className="logview-results__fetched">
                  Fetched at {formattedTime}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ------ Output area ------ */}
        <div className="logview-output-wrapper">
          {instancesLoading && (
            <div className="logview-loading" role="status" aria-label="Loading instances">
              <Spinner size={24} label="Loading instances" />
              <span className="logview-loading__text">Loading instances…</span>
            </div>
          )}

          {!instancesLoading && instancesError && (
            <ErrorState message={instancesError} onRetry={fetchInstances} />
          )}

          {!instancesLoading && !instancesError && instances.length === 0 && (
            <EmptyState message="No Online instances available." />
          )}

          {!controlsDisabled && (
            <>
              {showInitialLoader && (
                <div className="logview-loading" role="status" aria-label="Loading logs">
                  <Spinner size={24} label="Loading logs" />
                  <span className="logview-loading__text">Loading logs…</span>
                </div>
              )}

              {!logsLoading && logsError && (
                <ErrorState message={logsError} onRetry={() => void fetchLogs()} />
              )}

              {!showInitialLoader && !logsError && !hasFetched && (
                <EmptyState message="Select an instance and click View logs." icon="search" />
              )}

              {!showInitialLoader && !logsError && hasFetched && logs.length === 0 && (
                <EmptyState message="No log lines matched the current filters." />
              )}

              {showContent && (
                <div className="logview-output" role="log" aria-live="polite">
                  {logs.map((entry, i) => (
                    <SystemLogLine
                      key={i}
                      entry={entry}
                      onCopy={(text) => void copyLine(text)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
