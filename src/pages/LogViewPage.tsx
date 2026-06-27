import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getLogs } from '../api/logs';
import { getProject } from '../api/projects';
import type { LogEntryDto, LogLevel, LogsQueryParams, LogType, ProjectDto } from '../api/types';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Icon } from '../components/Icon';
import { LogStatsPanel } from '../components/LogStatsPanel';
import { ProjectHealthPanel } from '../components/ProjectHealthPanel';
import { Spinner } from '../components/Spinner';
import { useToast } from '../context/ToastContext';
import './LogViewPage.css';

// ---------------------------------------------------------------
// Status badge helpers
// ---------------------------------------------------------------
function getStatusClass(status?: number): string {
  if (!status) return 'badge--neutral';
  if (status >= 500) return 'badge--error';
  if (status >= 400) return 'badge--warn';
  if (status >= 300) return 'badge--info';
  return 'badge--ok';
}

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

// ---------------------------------------------------------------
// Log line rendering
// ---------------------------------------------------------------
function LogLine({
  entry,
  logType,
  onCopy,
}: {
  entry: LogEntryDto;
  logType: LogType;
  onCopy: (text: string) => void;
}) {
  const time = formatLineTime(entry.timestamp);

  return (
    <div className="log-line">
      {time && <span className="log-line__time">{time}</span>}

      {logType !== 'error' ? (
        <>
          {entry.status !== undefined && (
            <span className={`badge ${getStatusClass(entry.status)}`}>
              {entry.status}
            </span>
          )}
          {entry.method && (
            <span className="log-line__method">{entry.method}</span>
          )}
          {entry.path && <span className="log-line__path">{entry.path}</span>}
          <span className="log-line__raw">{entry.raw}</span>
        </>
      ) : (
        <>
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
        </>
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
function getLogErrorMessage(err: unknown): string {
  const res = (err as { response?: { status?: number; data?: { message?: string } } })?.response;
  const status = res?.status;
  switch (status) {
    case 400: {
      const msg = res?.data?.message ?? '';
      return msg.toLowerCase().includes('backend')
        ? 'This site has no separate backend log (not proxied).'
        : 'Invalid request.';
    }
    case 503:
      return "This project's server is unreachable right now. It may be offline or still starting up.";
    case 502:
      return 'The log service failed while reading from the server. Try again in a moment.';
    case 504:
      return 'The log read timed out. Try fewer lines or retry.';
    case 403:
      return "You don't have access to this project's logs.";
    case 404:
      return 'Project not found.';
    default:
      return 'Failed to load logs. Please retry.';
  }
}

// ---------------------------------------------------------------
// Page component
// ---------------------------------------------------------------
export function LogViewPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notify } = useToast();

  const [project, setProject] = useState<ProjectDto | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntryDto[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [logType, setLogType] = useState<LogType>('access');
  const [lastLines, setLastLines] = useState<string>('100');
  const [textFilter, setTextFilter] = useState('');
  const [statusCode, setStatusCode] = useState('');
  const [level, setLevel] = useState<LogLevel | ''>('');

  const fetchLogs = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);

    const params: LogsQueryParams = {
      projectId,
      logType,
      ...(lastLines ? { lastLines: Number(lastLines) } : {}),
      ...(textFilter ? { text: textFilter } : {}),
      ...(statusCode ? { statusCode } : {}),
      ...(level ? { level: level as LogLevel } : {}),
    };

    try {
      const data = await getLogs(params);
      setLogs(data.lines);
      setTruncated(data.truncated);
      setFetchedAt(data.fetchedAt);
    } catch (err) {
      setError(getLogErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [projectId, logType, lastLines, textFilter, statusCode, level]);

  // Fetch project metadata once — never fall back to UUID
  useEffect(() => {
    if (!projectId) return;
    setProjectLoading(true);
    getProject(projectId)
      .then((p) => setProject(p))
      .catch(() => setProject(null))
      .finally(() => setProjectLoading(false));
  }, [projectId]);

  // Initial log fetch
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const copyText = useCallback(
    async (text: string, okMessage: string) => {
      try {
        await navigator.clipboard.writeText(text);
        notify('success', okMessage);
      } catch {
        notify('error', 'Could not copy to clipboard.');
      }
    },
    [notify],
  );

  const copyAll = useCallback(() => {
    if (logs.length === 0) return;
    const text = logs.map((entry) => entry.raw).join('\n');
    void copyText(text, `Copied ${logs.length} log lines`);
  }, [logs, copyText]);

  const formattedTime = fetchedAt
    ? new Date(fetchedAt).toLocaleTimeString()
    : '';

  // Active-filter chips so the user always sees what is being applied
  const activeFilters: string[] = [
    `Last ${lastLines || '100'} lines`,
    ...(textFilter ? [`Text: "${textFilter}"`] : []),
    ...((logType === 'access' || logType === 'backend') && statusCode ? [`Status: ${statusCode}`] : []),
    ...(logType === 'error' && level ? [`Level: ${level}`] : []),
  ];

  // Keep existing logs visible while refreshing — only blank out on first load
  const showInitialLoader = isLoading && logs.length === 0 && !error;
  const isRefreshing = isLoading && logs.length > 0;
  const showContent = !error && logs.length > 0;

  return (
    <div className="logview-page">
      <AppHeader />
      <main className="logview-main">

      {/* ------ Breadcrumb + header ------ */}
      <nav className="logview-breadcrumb" aria-label="Breadcrumb">
        <Link to="/projects" className="logview-breadcrumb__link">
          Projects
        </Link>
        <span className="logview-breadcrumb__sep" aria-hidden="true">/</span>
        <span className="logview-breadcrumb__current" aria-current="page">
          {projectLoading ? 'Loading…' : project?.name ?? 'Project'}
        </span>
      </nav>

      <header className="logview-header">
        <div className="logview-header__meta">
          {projectLoading ? (
            <div className="logview-header__skeleton" aria-hidden="true">
              <div className="logview-header__skeleton-title" />
              <div className="logview-header__skeleton-subtitle" />
            </div>
          ) : (
            <>
              <h1 className="logview-header__title">
                {project?.name ?? 'Project'}
              </h1>
              {project?.domain && (
                <p className="logview-header__domain">{project.domain}</p>
              )}
            </>
          )}
        </div>
        <button
          type="button"
          className="op-button-ghost logview-header__back"
          onClick={() => navigate('/projects')}
        >
          <Icon name="arrowLeft" size={16} />
          All projects
        </button>
      </header>

      {/* ------ Project health + SSL panel ------ */}
      {projectId && <ProjectHealthPanel projectId={projectId} />}

      {/* ------ Filter bar ------ */}
      <div className="logview-filters" role="search" aria-label="Log filters">
        {/* Log type */}
        <div className="filter-field">
          <label className="filter-label" htmlFor="logType">Type</label>
          <select
            id="logType"
            className="filter-input"
            value={logType}
            onChange={(e) => setLogType(e.target.value as LogType)}
          >
            <option value="access">Access</option>
            <option value="backend">Backend (origin)</option>
            <option value="error">Error</option>
          </select>
        </div>

        {/* Last lines */}
        <div className="filter-field">
          <label className="filter-label" htmlFor="lastLines">Lines</label>
          <input
            id="lastLines"
            className="filter-input filter-input--narrow"
            type="number"
            min={1}
            max={5000}
            value={lastLines}
            onChange={(e) => setLastLines(e.target.value)}
            placeholder="100"
          />
        </div>

        {/* Text search */}
        <div className="filter-field filter-field--grow">
          <label className="filter-label" htmlFor="textFilter">Search</label>
          <input
            id="textFilter"
            className="filter-input"
            type="search"
            value={textFilter}
            onChange={(e) => setTextFilter(e.target.value)}
            placeholder="Filter log text…"
          />
        </div>

        {/* Status code (access + backend logs) */}
        {(logType === 'access' || logType === 'backend') && (
          <div className="filter-field">
            <label className="filter-label" htmlFor="statusCode">Status</label>
            <input
              id="statusCode"
              className="filter-input filter-input--narrow"
              type="text"
              value={statusCode}
              onChange={(e) => setStatusCode(e.target.value)}
              placeholder="e.g. 404"
            />
          </div>
        )}

        {/* Level (error logs) */}
        {logType === 'error' && (
          <div className="filter-field">
            <label className="filter-label" htmlFor="level">Level</label>
            <select
              id="level"
              className="filter-input"
              value={level}
              onChange={(e) => setLevel(e.target.value as LogLevel | '')}
            >
              <option value="">All</option>
              <option value="error">Error</option>
              <option value="warn">Warn</option>
              <option value="notice">Notice</option>
              <option value="info">Info</option>
            </select>
          </div>
        )}

        {/* Refresh */}
        <div className="filter-field filter-field--action">
          <button
            type="button"
            className="logview-refresh"
            onClick={fetchLogs}
            disabled={isLoading}
            aria-label="Refresh logs"
          >
            <Icon name="refresh" size={16} />
            {isLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ------ Backend log hint ------ */}
      {logType === 'backend' && (
        <p className="logview-type-hint">
          Origin (apache) log — where 5xx and timeouts surface even when the nginx access log looks healthy.
        </p>
      )}

      {/* ------ Truncated warning ------ */}
      {truncated && (
        <div className="logview-truncated-banner" role="alert">
          Output truncated — reduce <strong>lastLines</strong> or add filters.
        </div>
      )}

      {/* ------ Stats overview (derived from loaded lines) ------ */}
      {showContent && <LogStatsPanel lines={logs} logType={logType} />}

      {/* ------ Results toolbar ------ */}
      {(showContent || isRefreshing) && (
        <div className="logview-results">
          <div className="logview-results__left">
            <span className="logview-results__count">
              {isRefreshing && <Spinner size={14} label="Refreshing logs" />}
              {logs.length} {logs.length === 1 ? 'line' : 'lines'}
            </span>
            <div className="logview-results__chips">
              {activeFilters.map((chip) => (
                <span key={chip} className="logview-chip">{chip}</span>
              ))}
            </div>
            {fetchedAt && (
              <span className="logview-results__fetched">
                Fetched at {formattedTime}
              </span>
            )}
          </div>
          <button
            type="button"
            className="op-button-ghost logview-results__copy"
            onClick={copyAll}
            disabled={logs.length === 0}
          >
            <Icon name="copy" size={14} />
            Copy all
          </button>
        </div>
      )}

      {/* ------ Log output ------ */}
      <div className="logview-output-wrapper">
        {showInitialLoader && (
          <div className="logview-loading" role="status" aria-label="Loading logs">
            <Spinner size={24} label="Loading logs" />
            <span className="logview-loading__text">Loading logs…</span>
          </div>
        )}

        {!isLoading && error && (
          <ErrorState message={error} onRetry={fetchLogs} />
        )}

        {!showInitialLoader && !error && logs.length === 0 && (
          <EmptyState message="No log lines matched the current filters." />
        )}

        {showContent && (
          <div className="logview-output" role="log" aria-live="polite">
            {logs.map((entry, i) => (
              <LogLine
                key={i}
                entry={entry}
                logType={logType}
                onCopy={(text) => void copyText(text, 'Line copied')}
              />
            ))}
          </div>
        )}
      </div>
      </main>
    </div>
  );
}
