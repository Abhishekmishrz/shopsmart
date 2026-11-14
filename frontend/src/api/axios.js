import axios from 'axios';

// One axios instance for the whole app, pointing at our backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5050/api',
});

// Before every request: attach the login token if we have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// After every response: turn errors into one readable message
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Our backend always sends { message }, so show that to the user
    error.message = error.response?.data?.message || 'Could not reach the server. Please try again.';

    // A request with a token got 401: the token expired or is invalid, so log out
    if (error.response?.status === 401 && error.config.headers.Authorization) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

export default api;
