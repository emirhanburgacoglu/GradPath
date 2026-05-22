import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5250/api/v1';
export const API_BASE = API_URL.replace(/\/api\/v1\/?$/, '');

export function resolvePhotoUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
