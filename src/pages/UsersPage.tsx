import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { createUser, listUsers } from '../api/users';
import type { CreateUserRequestDto, UserResponseDto } from '../api/types';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';
import './UsersPage.css';

export function UsersPage() {
  const { user: currentUser } = useAuth();

  // Redirect non-admin users immediately
  if (currentUser !== null && currentUser?.role !== 'admin') {
    return <Navigate to="/projects" replace />;
  }

  return <UsersPageContent />;
}

function UsersPageContent() {
  const [users, setUsers] = useState<UserResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'viewer'>('viewer');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listUsers();
      setUsers(data.items);
    } catch {
      setError('Failed to load users. Please retry.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleCreateUser(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const body: CreateUserRequestDto = {
      email: formEmail,
      password: formPassword,
      role: formRole,
    };

    try {
      await createUser(body);
      setFormEmail('');
      setFormPassword('');
      setFormRole('viewer');
      await fetchUsers();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 409) {
        setFormError('A user with this email already exists.');
      } else {
        setFormError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="users-page">
      <AppHeader />

      <main className="users-main">
        <h1 className="users-page__title">Users</h1>

        {/* ------ Create user form ------ */}
        <section className="users-create-section" aria-labelledby="create-user-heading">
          <h2 id="create-user-heading" className="users-create-section__title">
            Create User
          </h2>

          <form className="users-form" onSubmit={handleCreateUser} noValidate>
            <div className="users-form__row">
              <div className="users-form__field">
                <label className="users-form__label" htmlFor="create-email">
                  Email
                </label>
                <input
                  id="create-email"
                  className="users-form__input"
                  type="email"
                  autoComplete="off"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>

              <div className="users-form__field">
                <label className="users-form__label" htmlFor="create-password">
                  Password
                </label>
                <input
                  id="create-password"
                  className="users-form__input"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                />
              </div>

              <div className="users-form__field users-form__field--narrow">
                <label className="users-form__label" htmlFor="create-role">
                  Role
                </label>
                <select
                  id="create-role"
                  className="users-form__select"
                  value={formRole}
                  onChange={(e) =>
                    setFormRole(e.target.value as 'admin' | 'viewer')
                  }
                >
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="users-form__field users-form__field--action">
                <button
                  type="submit"
                  className="users-form__submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating…' : 'Create'}
                </button>
              </div>
            </div>

            {formError && (
              <p className="users-form__error" role="alert">
                {formError}
              </p>
            )}
          </form>
        </section>

        {/* ------ User list ------ */}
        <section className="users-list-section" aria-labelledby="user-list-heading">
          <h2 id="user-list-heading" className="users-list-section__title">
            All Users
          </h2>

          {isLoading && <LoadingSkeleton count={5} />}

          {!isLoading && error && (
            <ErrorState message={error} onRetry={fetchUsers} />
          )}

          {!isLoading && !error && users.length === 0 && (
            <EmptyState message="No users yet." />
          )}

          {!isLoading && !error && users.length > 0 && (
            <div className="users-table-wrapper">
              <table className="users-table" aria-label="User list">
                <thead>
                  <tr>
                    <th className="users-table__th">Email</th>
                    <th className="users-table__th">Role</th>
                    <th className="users-table__th">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="users-table__row">
                      <td className="users-table__td users-table__td--email">
                        {u.email}
                      </td>
                      <td className="users-table__td">
                        <span
                          className={`users-role-badge users-role-badge--${u.role}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="users-table__td users-table__td--meta">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
