import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const url = config.url || '';
    const isAdminRequest = url.startsWith('/admin') || url.startsWith('admin') || url.startsWith('/api/admin') || url.startsWith('api/admin');
    const token = isAdminRequest
      ? localStorage.getItem('adminToken')
      : (localStorage.getItem('userToken') || localStorage.getItem('adminToken'));

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userOnboarded');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;