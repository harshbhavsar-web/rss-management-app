import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('userToken');
  
  if (token) {
    // Redirect them to /home if they are already logged in and try to access login/signup
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default PublicRoute;
