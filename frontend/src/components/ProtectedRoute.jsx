import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';

// Wraps routes that need a login. adminOnly also requires the admin role.
export default function ProtectedRoute({ adminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Still checking the saved token: wait instead of wrongly sending them to login
  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  // Not logged in: go to login, and remember this page so login can send them back
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;

  // Logged in but not an admin
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;

  return <Outlet />;
}
