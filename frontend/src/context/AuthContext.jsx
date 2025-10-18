import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { getStoredToken, setAuthToken } from '../lib/api.js';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const storedToken = getStoredToken();
      const storedUser = localStorage.getItem('codex_user');

      if (storedToken) {
        setAuthToken(storedToken);
        setToken(storedToken);
      }

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Failed to parse stored user', error);
          localStorage.removeItem('codex_user');
        }
      }

      if (storedToken && !storedUser) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.user);
          localStorage.setItem('codex_user', JSON.stringify(data.user));
        } catch (error) {
          console.error('Failed to fetch current user', error);
          setAuthToken(null);
          setToken(null);
        }
      }

      setInitialized(true);
    };

    initialize();
  }, []);

  const handleAuthSuccess = (authPayload) => {
    setToken(authPayload.token);
    setAuthToken(authPayload.token);
    setUser(authPayload.user);
    localStorage.setItem('codex_user', JSON.stringify(authPayload.user));
  };

  const login = async (credentials) => {
    try {
      const { data } = await api.post('/auth/login', credentials);
      handleAuthSuccess(data);
      toast.success(`Welcome back, ${data.user.displayName}!`);
      const redirectTo = location.state?.from || '/';
      navigate(redirectTo, { replace: true });
      return data.user;
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to sign in';
      toast.error(message);
      throw error;
    }
  };

  const register = async (payload) => {
    try {
      const { data } = await api.post('/auth/register', payload);
      handleAuthSuccess(data);
      toast.success(`Account created for ${data.user.displayName}`);
      navigate('/', { replace: true });
      return data.user;
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to create account';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout request failed', error);
    } finally {
      setAuthToken(null);
      setToken(null);
      setUser(null);
      localStorage.removeItem('codex_user');
      navigate('/');
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      initialized,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
      setUser,
    }),
    [user, token, initialized],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
