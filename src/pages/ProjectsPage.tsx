import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listProjects } from '../api/projects';
import type { ProjectListItemDto } from '../api/types';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import './ProjectsPage.css';

const PAGE_SIZE = 24;

export function ProjectsPage() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectListItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

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

  // Show pagination once there is data or after the initial load finishes
  const showPagination = !error && !(isLoading && projects.length === 0);

  return (
    <div className="projects-page">
      <AppHeader />
      <header className="projects-header">
        <h1 className="projects-header__title">Projects</h1>
        <input
          type="search"
          className="projects-search"
          placeholder="Search by name or domain…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search projects"
        />
      </header>

      <main className="projects-content">
        {isLoading && <LoadingSkeleton count={8} />}

        {!isLoading && error && (
          <ErrorState message={error} onRetry={handleRetry} />
        )}

        {!isLoading && !error && projects.length === 0 && (
          <EmptyState message="No projects found." />
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
                <h4 className="project-card__name">{project.name}</h4>
                <p className="project-card__domain">{project.domain}</p>
                {project.lastSyncedAt && (
                  <p className="project-card__meta">
                    Last synced:{' '}
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
