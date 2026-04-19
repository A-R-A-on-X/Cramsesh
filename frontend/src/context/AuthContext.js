import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('cramsesh_user');
    const token = localStorage.getItem('cramsesh_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
      api.get('/auth/me').then(res => {
        setUser(res.data);
        localStorage.setItem('cramsesh_user', JSON.stringify(res.data));
      }).catch(() => logout());
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('cramsesh_token', res.data.token);
    localStorage.setItem('cramsesh_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const register = async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password });
    localStorage.setItem('cramsesh_token', res.data.token);
    localStorage.setItem('cramsesh_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('cramsesh_token');
    localStorage.removeItem('cramsesh_user');
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await api.get('/auth/me');
    setUser(res.data);
    localStorage.setItem('cramsesh_user', JSON.stringify(res.data));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
