import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { BackendStatusProvider } from './context/BackendStatusContext';
import { BackendStatusBanner } from './components/BackendStatusBanner';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { LogViewPage } from './pages/LogViewPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { UsersPage } from './pages/UsersPage';
import { SystemStatusPage } from './pages/SystemStatusPage';

export default function App() {
  return (
    <BrowserRouter>
      <BackendStatusProvider>
        <AuthProvider>
          <BackendStatusBanner />
          <ToastProvider>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected */}
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <ProjectsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id/logs"
                element={
                  <ProtectedRoute>
                    <LogViewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system-status"
                element={
                  <ProtectedRoute>
                    <SystemStatusPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all → /projects */}
              <Route path="/" element={<Navigate to="/projects" replace />} />
              <Route path="*" element={<Navigate to="/projects" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BackendStatusProvider>
    </BrowserRouter>
  );
}
