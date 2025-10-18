import axios, { AxiosError } from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem('codex_token', token);
  } else {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem('codex_token');
  }
};

export const getStoredToken = (): string | null => localStorage.getItem('codex_token');

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      setAuthToken(null);
    }
    return Promise.reject(error);
  },
);

export default api;
