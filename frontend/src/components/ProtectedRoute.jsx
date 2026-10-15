import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('userToken');
  const isOnboarded = localStorage.getItem('userOnboarded') === 'true';
  const role = localStorage.getItem('userRole');
  const location = useLocation();
  
  if (!token) {
    // Redirect to Welcome Page if not logged in
    return <Navigate to="/" replace />;
  }

  // Enforce onboarding flow for users
  if (role !== 'admin' && !isOnboarded) {
    if (location.pathname !== '/onboarding' && location.pathname !== '/join') {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
