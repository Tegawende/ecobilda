import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../../services/api';

interface GuestOnlyRouteProps {
  children: React.ReactNode;
}

export function GuestOnlyRoute({ children }: GuestOnlyRouteProps) {
  if (isAuthenticated()) {
    // Redirect to projects page if already authenticated
    return <Navigate to="/projects" replace />;
  }

  return <>{children}</>;
}
