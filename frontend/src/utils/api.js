import axios from 'axios';

// Dynamically determine the backend URL based on where the frontend is served from
const backendHostname = window.location.hostname; // e.g. 'localhost' or '192.168.1.5'
const defaultApiUrl = `http://${backendHostname}:5000/api`;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || defaultApiUrl,
});

// Add a request interceptor to include token
api.interceptors.request.use(
  (config) => {
    // Check route to attach the correct token to avoid privilege mismatch
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    const token = isAdminRoute ? localStorage.getItem('adminToken') : (localStorage.getItem('userToken') || localStorage.getItem('adminToken'));
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for global 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      if (isAdminRoute) {
        localStorage.removeItem('adminToken');
        if (window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      } else {
        localStorage.removeItem('userToken');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
