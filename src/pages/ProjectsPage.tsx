import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listProjects, syncProjects } from '../api/projects';
import type { ProjectListItemDto, SyncResultDto } from '../api/types';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Icon } from '../components/Icon';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';
import './ProjectsPage.css';

const PAGE_SIZE = 24;

export function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [projects, setProjects] = useState<ProjectListItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResultDto | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input — 300ms; resets page to 1 when the term changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Fetch whenever page, debouncedSearch, or retryCount changes
  useEffect(() => {
    let cancelled = false;

    async function fetchProjects() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listProjects({
          page,
          pageSize: PAGE_SIZE,
          search: debouncedSearch,
        });
        if (!cancelled) {
          setProjects(data.items);
          setTotal(data.total);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load projects. Please retry.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchProjects();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, retryCount]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleRetry = () => setRetryCount((n) => n + 1);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncError(null);
    setSyncResult(null);
    try {
      const result = await syncProjects();
      setSyncResult(result);
      setRetryCount((n) => n + 1); // re-trigger the existing fetch effect
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 403) {
        setSyncError("You don't have permission to sync.");
      } else if (
        !axiosErr.response ||
        (axiosErr.response.status !== undefined && axiosErr.response.status >= 500)
      ) {
        setSyncError('Sync failed. Please try again.');
      } else {
        setSyncError('Sync failed. Please try again.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Show pagination once there is data or after the initial load finishes
  const showPagination = !error && !(isLoading && projects.length === 0);

  return (
    <div className="projects-page">
      <AppHeader />
      <header className="projects-header">
        <h1 className="projects-header__title">Projects</h1>
        <div className="projects-header__actions">
          <div className="projects-search-wrap">
            <Icon name="search" size={16} className="projects-search-wrap__icon" />
            <input
              type="search"
              className="projects-search"
              placeholder="Search by name or domain…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search projects"
            />
          </div>
          {isAdmin && (
            <div className="projects-sync">
              <button
                className="op-button-primary"
                onClick={handleSync}
                disabled={isSyncing}
                aria-label="Sync all projects from configured instances"
              >
                {isSyncing && <span className="projects-sync__spinner" aria-hidden="true" />}
                {isSyncing ? 'Syncing…' : 'Sync projects'}
              </button>
              {isSyncing && (
                <p className="projects-sync__hint" role="status" aria-live="polite">
                  Syncing all instances… this can take up to a minute.
                </p>
              )}
            </div>
          )}
        </div>
      </header>

      {syncResult && (
        <div className="projects-sync-result" role="status" aria-live="polite">
          <span>
            Synced — {syncResult.created} added, {syncResult.updated} updated
            {syncResult.rejected ? `, ${syncResult.rejected} rejected` : ''} across{' '}
            {syncResult.instancesScanned} instance(s).
          </span>
          <button
            className="projects-sync-result__close"
            onClick={() => setSyncResult(null)}
            aria-label="Dismiss sync result"
          >
            ×
          </button>
        </div>
      )}

      {syncError && (
        <div className="projects-sync-error" role="alert">
          <span>{syncError}</span>
          <button
            className="projects-sync-error__close"
            onClick={() => setSyncError(null)}
            aria-label="Dismiss sync error"
          >
            ×
          </button>
        </div>
      )}

      {(search !== debouncedSearch || debouncedSearch) && (
        <p className="projects-search-status" role="status" aria-live="polite">
          {search !== debouncedSearch
            ? 'Searching…'
            : `${total} ${total === 1 ? 'result' : 'results'} for "${debouncedSearch}"`}
        </p>
      )}

      <main className="projects-content">
        {isLoading && <LoadingSkeleton count={8} />}

        {!isLoading && error && (
          <ErrorState message={error} onRetry={handleRetry} />
        )}

        {!isLoading && !error && projects.length === 0 && (
          <EmptyState icon="folder" message="No projects found." />
        )}

        {!isLoading && !error && projects.length > 0 && (
          <div className="projects-grid" role="list">
            {projects.map((project) => (
              <button
                key={project.id}
                className="project-card"
                role="listitem"
                onClick={() => navigate(`/projects/${project.id}/logs`)}
                aria-label={`Open logs for ${project.name}`}
              >
                <span className="project-card__head">
                  <span className="project-card__avatar" aria-hidden="true">
                    <Icon name="folder" size={18} />
                  </span>
                  <h4 className="project-card__name">{project.name}</h4>
                  <Icon
                    name="chevronRight"
                    size={16}
                    className="project-card__go"
                  />
                </span>
                <p className="project-card__domain">
                  <Icon name="globe" size={13} />
                  {project.domain}
                </p>
                {project.lastSyncedAt && (
                  <p className="project-card__meta">
                    <Icon name="clock" size={12} />
                    Last synced{' '}
                    {new Date(project.lastSyncedAt).toLocaleDateString()}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </main>

      {showPagination && (
        <nav className="projects-pagination" aria-label="Projects pagination">
          <button
            className="op-button-ghost projects-pagination__btn"
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1 || isLoading}
            aria-label="Previous page"
          >
            Prev
          </button>

          <span className="projects-pagination__info">
            <span className="projects-pagination__page">
              Page {page} of {totalPages}
            </span>
            <span className="projects-pagination__count">
              {total} projects
            </span>
          </span>

          <button
            className="op-button-ghost projects-pagination__btn"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages || isLoading}
            aria-label="Next page"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
