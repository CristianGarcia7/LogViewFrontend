import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AppHeader.css';

export function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <nav className="app-header__nav" aria-label="Main navigation">
        <Link className="app-header__nav-link" to="/projects">
          Projects
        </Link>
        {user?.role === 'admin' && (
          <Link className="app-header__nav-link" to="/users">
            Users
          </Link>
        )}
      </nav>

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
    </header>
  );
}
