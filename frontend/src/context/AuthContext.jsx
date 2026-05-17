import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize user from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('user');
      if (saved) {
        const parsedUser = JSON.parse(saved);
        setUser(parsedUser);
        console.log('[AUTH] User loaded from localStorage:', parsedUser.email);
      }
    } catch (err) {
      console.error('[AUTH] Failed to load user from localStorage:', err);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      console.log('[AUTH] Logging in:', email);

      const { data } = await api.post('/auth/login', { email, password });

      // Store token and user
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);

      console.log('[AUTH] Login successful:', data.user.email);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed';
      setError(errorMessage);
      console.error('[AUTH] Login error:', errorMessage);
      throw err;
    }
  };

  const register = async (email, password, full_name) => {
    try {
      setError(null);
      console.log('[AUTH] Registering:', email);

      const { data } = await api.post('/auth/register', {
        email,
        password,
        full_name,
      });

      // Store token and user
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);

      console.log('[AUTH] Registration successful:', data.user.email);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Registration failed';
      setError(errorMessage);
      console.error('[AUTH] Registration error:', errorMessage);
      throw err;
    }
  };

  const logout = () => {
    console.log('[AUTH] Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
