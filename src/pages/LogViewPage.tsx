import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLogs } from '../api/logs';
import { getProject } from '../api/projects';
import type { LogEntryDto, LogLevel, LogsQueryParams, LogType } from '../api/types';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
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

// ---------------------------------------------------------------
// Log line rendering
// ---------------------------------------------------------------
function LogLine({
  entry,
  logType,
}: {
  entry: LogEntryDto;
  logType: LogType;
}) {
  if (logType === 'access') {
    return (
      <div className="log-line">
        {entry.status !== undefined && (
          <span className={`badge ${getStatusClass(entry.status)}`}>
            {entry.status}
          </span>
        )}
        {entry.method && (
          <span className="log-line__method">{entry.method}</span>
        )}
        {entry.path && (
          <span className="log-line__path">{entry.path}</span>
        )}
        <span className="log-line__raw">{entry.raw}</span>
      </div>
    );
  }

  // error log type
  return (
    <div className="log-line">
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
    </div>
  );
}

// ---------------------------------------------------------------
// Page component
// ---------------------------------------------------------------
export function LogViewPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState<string>('');
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
    } catch {
      setError('Failed to load logs. Please retry.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, logType, lastLines, textFilter, statusCode, level]);

  // Fetch project name once
  useEffect(() => {
    if (!projectId) return;
    getProject(projectId)
      .then((p) => setProjectName(p.name))
      .catch(() => setProjectName(projectId));
  }, [projectId]);

  // Initial log fetch
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formattedTime = fetchedAt
    ? new Date(fetchedAt).toLocaleTimeString()
    : '';

  return (
    <div className="logview-page">
      <AppHeader />
      {/* ------ Header ------ */}
      <header className="logview-header">
        <button
          type="button"
          className="logview-header__back"
          onClick={() => navigate('/projects')}
          aria-label="Back to projects"
        >
          ← Back
        </button>
        <h1 className="logview-header__title">
          {projectName || projectId}
        </h1>
      </header>

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

        {/* Status code (access logs) */}
        {logType === 'access' && (
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
            aria-label="Refresh logs"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ------ Truncated warning ------ */}
      {truncated && (
        <div className="logview-truncated-banner" role="alert">
          Output truncated — reduce <strong>lastLines</strong> or add filters.
        </div>
      )}

      {/* ------ fetchedAt ------ */}
      {fetchedAt && !isLoading && (
        <p className="logview-fetched-at">Fetched at {formattedTime}</p>
      )}

      {/* ------ Log output ------ */}
      <div className="logview-output-wrapper">
        {isLoading && (
          <div className="logview-loading" role="status" aria-label="Loading logs">
            <span className="logview-loading__text">Loading logs…</span>
          </div>
        )}

        {!isLoading && error && (
          <ErrorState message={error} onRetry={fetchLogs} />
        )}

        {!isLoading && !error && logs.length === 0 && (
          <EmptyState message="No log lines matched the current filters." />
        )}

        {!isLoading && !error && logs.length > 0 && (
          <div className="logview-output" role="log" aria-live="polite">
            {logs.map((entry, i) => (
              <LogLine key={i} entry={entry} logType={logType} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
