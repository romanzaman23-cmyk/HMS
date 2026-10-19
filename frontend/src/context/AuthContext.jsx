import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hms_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('hms_token');
      const storedUser = localStorage.getItem('hms_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Verify with backend
          const res = await api.get('/auth/me');
          if (res.data && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('hms_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          if (err.response && err.response.status === 401) {
            console.warn('Session expired (401):', err.message);
            localStorage.removeItem('hms_token');
            localStorage.removeItem('hms_user');
            setUser(null);
            setToken(null);
          } else {
            // Keep existing stored user active in live demo/offline mode
            console.info('Backend verification offline, running on preserved local session.');
          }
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('hms_token', newToken);
      localStorage.setItem('hms_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return newUser;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_user');
    setToken(null);
    setUser(null);
  };

  const quickLogin = async (role) => {
    if (role === 'PRINCIPAL_ADMIN') {
      return await login('admin@highlight.school', 'Admin@123');
    } else {
      return await login('parent@highlight.school', 'Parent@123');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, quickLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
