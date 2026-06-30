import { Navigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Icon } from '../components/Icon';
import { SystemHealthPanel } from '../components/SystemHealthPanel';
import { useAuth } from '../context/AuthContext';
import './SystemStatusPage.css';

export function SystemStatusPage() {
  const { user: currentUser } = useAuth();

  // Redirect non-admin users immediately (but not while auth is still loading).
  if (currentUser !== null && currentUser?.role !== 'admin') {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="system-status-page">
      <AppHeader />

      <main className="system-status-main">
        <h1 className="system-status-page__title">
          <Icon name="shield" size={24} />
          System Status
        </h1>

        <SystemHealthPanel />
      </main>
    </div>
  );
}
