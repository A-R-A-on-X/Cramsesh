import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cramsesh_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isLoginRoute = err.config?.url?.includes('/auth/login');
      const isRegisterRoute = err.config?.url?.includes('/auth/register');
      if (!isLoginRoute && !isRegisterRoute) {
        localStorage.removeItem('cramsesh_token');
        localStorage.removeItem('cramsesh_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
