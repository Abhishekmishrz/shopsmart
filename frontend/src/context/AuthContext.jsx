import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

// Holds the logged-in user and makes it available to every component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // True while we check a saved token on page load, so we don't flash "logged out"
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('token')));
  // A one-time message for the user, e.g. after logging out. `open` is separate from the text
  // so the text stays visible while the message fades away.
  const [notice, setNotice] = useState({ open: false, message: '' });

  // On page load: if a token was saved, ask the backend who it belongs to
  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api
      .get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  // The axios interceptor fires this when the token stops working
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  // Login and register both answer with { user, token }
  const saveSession = ({ user, token }) => {
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    return saveSession(data);
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    return saveSession(data);
  };

  // Only for the Log out button. An expired token logs out quietly through 'auth:logout' above.
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setNotice({ open: true, message: "You've been logged out" });
  };

  const closeNotice = () => setNotice((current) => ({ ...current, open: false }));

  return (
    <AuthContext value={{ user, loading, login, register, logout, notice, closeNotice }}>
      {children}
    </AuthContext>
  );
}

// Usage in any component: const { user, login } = useAuth();
// The hook lives next to its provider on purpose, so skip the fast-refresh rule here
// eslint-disable-next-line react/only-export-components
export const useAuth = () => useContext(AuthContext);
