import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  refreshQueue.forEach((p) => (token ? p.resolve(token) : p.reject(error)));
  refreshQueue = [];
}

// Handle 401 → attempt refresh; handle INSUFFICIENT_AAL
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const code = error.response?.data?.error?.code;

    // Skip refresh for auth endpoints themselves
    const isAuthEndpoint = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');

    // Token expired — try refresh once
    if (status === 401 && !original._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            },
            reject,
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // Refresh token sent via httpOnly cookie (withCredentials)
        const res = await axios.post(`${API_BASE_URL}/v1/auth/refresh`, {}, { withCredentials: true });
        const { accessToken, expiresIn } = res.data.data;
        useAuthStore.getState().setAuth(accessToken, expiresIn);
        processQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    // Insufficient AAL — emit custom event for step-up modal
    if (status === 403 && code === 'INSUFFICIENT_AAL') {
      const detail = {
        requiredAAL: error.response?.data?.error?.requiredAAL,
        originalRequest: original,
      };
      window.dispatchEvent(new CustomEvent('helios:insufficient-aal', { detail }));
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);
