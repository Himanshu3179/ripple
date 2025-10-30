import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router-dom';
import toast from 'react-hot-toast';
import { isAxiosError } from 'axios';
import api, { getStoredToken, setAuthToken } from '../lib/api';
import type { AuthenticatedUser, AuthResponse } from '../types';

interface LoginPayload {
  identifier: string;
  password: string;
}

interface RegisterPayload {
  displayName: string;
  username: string;
  email: string;
  password: string;
  bio?: string;
}

interface AuthContextValue {
  user: AuthenticatedUser | null;
  token: string | null;
  initialized: boolean;
  isAuthenticated: boolean;
  isPremium: boolean;
  isUnlimited: boolean;
  isAdmin: boolean;
  login: (credentials: LoginPayload) => Promise<AuthenticatedUser>;
  register: (payload: RegisterPayload) => Promise<AuthenticatedUser>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AuthenticatedUser | null>>;
  refreshAccount: () => Promise<void>;
}

type LocationState = {
  from?: string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const navigate = useNavigate();
  const location = useLocation() as Location & { state: unknown };
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const persistUser = (nextUser: AuthenticatedUser | null) => {
    if (nextUser) {
      localStorage.setItem('codex_user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('codex_user');
    }
  };

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
          const parsed: AuthenticatedUser = {
            role: 'user',
            ...JSON.parse(storedUser),
          };
          setUser(parsed);
        } catch (error) {
          console.error('Failed to parse stored user', error);
          localStorage.removeItem('codex_user');
        }
      }

      if (storedToken && !storedUser) {
        try {
          const { data } = await api.get<{ user: AuthenticatedUser }>('/auth/me');
          setUser(data.user);
          persistUser(data.user);
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

  const handleAuthSuccess = (authPayload: AuthResponse) => {
    setToken(authPayload.token);
    setAuthToken(authPayload.token);
    setUser(authPayload.user);
    persistUser(authPayload.user);
  };

  const extractErrorMessage = (error: unknown, fallback: string) => {
    if (isAxiosError<{ message?: string }>(error)) {
      return error.response?.data?.message ?? fallback;
    }
    return fallback;
  };

  const login = async (credentials: LoginPayload) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', credentials);
      handleAuthSuccess(data);
      toast.success(`Welcome back, ${data.user.displayName}!`);
      const state = (location.state as LocationState | null) ?? {};
      const redirectTo = state.from || '/';
      navigate(redirectTo, { replace: true });
      return data.user;
    } catch (error) {
      const message = extractErrorMessage(error, 'Unable to sign in');
      toast.error(message);
      throw error;
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/register', payload);
      handleAuthSuccess(data);
      toast.success(`Account created for ${data.user.displayName}`);
      navigate('/', { replace: true });
      return data.user;
    } catch (error) {
      const message = extractErrorMessage(error, 'Unable to create account');
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

  const refreshAccount = async () => {
    if (!token) return;
    try {
      const { data } = await api.get<{
        starsBalance: number;
        membershipTier: AuthenticatedUser['membershipTier'];
        membershipExpiresAt: string | null;
        aiPostQuota?: { limit: number; used: number; renewsAt: string } | null;
      }>('/billing/balance');
      setUser((prev) => {
        if (!prev) return prev;
        const nextUser: AuthenticatedUser = {
          ...prev,
          starsBalance: data.starsBalance,
          membershipTier: data.membershipTier,
          membershipExpiresAt: data.membershipExpiresAt,
          aiPostQuota: data.aiPostQuota ?? prev.aiPostQuota ?? null,
        };
        persistUser(nextUser);
        return nextUser;
      });
    } catch (error) {
      console.error('Failed to refresh account details', error);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      initialized,
      isAuthenticated: Boolean(user && token),
      isPremium: Boolean(user && (user.membershipTier === 'star-pass' || user.membershipTier === 'star-unlimited')),
      isUnlimited: Boolean(user && user.membershipTier === 'star-unlimited'),
      isAdmin: Boolean(user && user.role === 'admin'),
      login,
      register,
      logout,
      setUser,
      refreshAccount,
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
