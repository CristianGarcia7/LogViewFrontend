import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AppHeader.css';

export function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <div className="app-header__left">
          <span className="app-header__brand">LogView</span>
          <nav className="app-header__nav" aria-label="Main navigation">
            <NavLink
              className={({ isActive }) =>
                `app-header__nav-link${isActive ? ' app-header__nav-link--active' : ''}`
              }
              to="/projects"
            >
              Projects
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink
                className={({ isActive }) =>
                  `app-header__nav-link${isActive ? ' app-header__nav-link--active' : ''}`
                }
                to="/users"
              >
                Users
              </NavLink>
            )}
          </nav>
        </div>

        <div className="app-header__user">
          {user?.email && (
            <span className="app-header__email" aria-label="Signed in as">
              {user.email}
            </span>
          )}
          <button
            type="button"
            className="app-header__logout"
            onClick={() => void logout()}
            aria-label="Sign out"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
