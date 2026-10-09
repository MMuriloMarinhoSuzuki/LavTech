import axios, { AxiosError } from 'axios';
import type { ApiError } from '@/types';

export const TOKEN_KEY = 'lavanderia_token';
export const USER_KEY = 'lavanderia_user';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      const onLoginPage = window.location.pathname.startsWith('/login');
      if (!onLoginPage) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ApiError>;
  if (axiosError.response?.data?.error) {
    const details = axiosError.response.data.details;
    if (details && details.length > 0) {
      return details.map((d) => d.message).join(', ');
    }
    return axiosError.response.data.error;
  }
  if (axiosError.code === 'ERR_NETWORK') {
    return 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.';
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
}

export default api;
