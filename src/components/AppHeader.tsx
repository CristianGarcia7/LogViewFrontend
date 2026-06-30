import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon } from './Icon';
import './AppHeader.css';

export function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <div className="app-header__left">
          <NavLink to="/projects" className="app-header__brand" aria-label="LogView — go to projects">
            <span className="app-header__brand-mark" aria-hidden="true" />
            LogView
          </NavLink>
          <nav className="app-header__nav" aria-label="Main navigation">
            <NavLink
              className={({ isActive }) =>
                `app-header__nav-link${isActive ? ' app-header__nav-link--active' : ''}`
              }
              to="/projects"
            >
              <Icon name="folder" size={16} />
              Projects
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink
                className={({ isActive }) =>
                  `app-header__nav-link${isActive ? ' app-header__nav-link--active' : ''}`
                }
                to="/users"
              >
                <Icon name="users" size={16} />
                Users
              </NavLink>
            )}
            {user?.role === 'admin' && (
              <NavLink
                className={({ isActive }) =>
                  `app-header__nav-link${isActive ? ' app-header__nav-link--active' : ''}`
                }
                to="/system-status"
              >
                <Icon name="shield" size={16} />
                System Status
              </NavLink>
            )}
            {user?.role === 'admin' && (
              <NavLink
                className={({ isActive }) =>
                  `app-header__nav-link${isActive ? ' app-header__nav-link--active' : ''}`
                }
                to="/system-logs"
              >
                <Icon name="activity" size={16} />
                System Logs
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
            <Icon name="logOut" size={14} />
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
