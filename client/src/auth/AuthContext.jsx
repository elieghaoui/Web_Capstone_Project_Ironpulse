import { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../api/client.js';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Who's logged in is state: the token lives in localStorage (survives a refresh)
// AND in useState (triggers a re-render). We always write to both and clear both.
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  function saveToken(value) {
    if (value) localStorage.setItem('token', value);
    else localStorage.removeItem('token');
    setToken(value);
  }

  async function login(email, password) {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    saveToken(data.token);
    return data.user; // so the login page can send admins to /admin
  }

  async function signup(name, email, password) {
    const data = await apiFetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    saveToken(data.token);
  }

  function logout() {
    saveToken(null);
  }

  // Ask the server again who we are, e.g. after choosing a new plan.
  async function refreshUser() {
    setUser(await apiFetch('/api/auth/me'));
  }

  // apiFetch fires 'auth:expired' when the server answers 401 -> log out.
  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, []);

  // When the token changes, ask the server who we are (name, role, plan).
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    apiFetch('/api/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [token]);

  const value = { token, user, loading, login, signup, logout, refreshUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
