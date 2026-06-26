import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listProjects } from '../api/projects';
import type { ProjectListItemDto } from '../api/types';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import './ProjectsPage.css';

export function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectListItemDto[]>([]);
  const [filtered, setFiltered] = useState<ProjectListItemDto[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listProjects();
      setProjects(data.items);
      setFiltered(data.items);
    } catch {
      setError('Failed to load projects. Please retry.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Debounced search — 300ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const q = search.trim().toLowerCase();
      if (!q) {
        setFiltered(projects);
      } else {
        setFiltered(
          projects.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.domain.toLowerCase().includes(q),
          ),
        );
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, projects]);

  return (
    <div className="projects-page">
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
          <ErrorState message={error} onRetry={fetchProjects} />
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <EmptyState message="No projects found." />
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <div className="projects-grid" role="list">
            {filtered.map((project) => (
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
    </div>
  );
}
