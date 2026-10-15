import { Navigate, useLocation } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  const userToken = localStorage.getItem('userToken');
  const adminToken = localStorage.getItem('adminToken');
  const location = useLocation();

  // If user is logged in and tries to access a public route, send them home
  if (userToken) {
    return <Navigate to="/home" replace />;
  }

  // If admin is logged in and tries to access login/signup pages, send to admin panel
  // But allow access to the Welcome Page (/) since it's the entry point
  if (adminToken && location.pathname !== '/') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;

