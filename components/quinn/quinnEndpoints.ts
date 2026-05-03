import { Platform } from 'react-native';

const QUINN_PUBLIC_BACKEND_BASE_URL =
  process.env.EXPO_PUBLIC_QUINN_BACKEND_BASE_URL ||
  (Platform.OS === 'web'
    ? 'http://127.0.0.1:8787'
    : 'https://quinnosbackend-production.up.railway.app');

export const QUINN_BACKEND_BASE_URL = QUINN_PUBLIC_BACKEND_BASE_URL;

export function buildQuinnBackendUrl(path: string): string {
  const cleanPath = String(path || '').startsWith('/') ? path : `/${path}`;
  return `${QUINN_BACKEND_BASE_URL}${cleanPath}`;
}
