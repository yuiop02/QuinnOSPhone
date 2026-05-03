import { Platform } from 'react-native';

const PRODUCTION_BACKEND_BASE_URL = 'https://quinnosbackend-production.up.railway.app';
const LOCAL_WEB_BACKEND_BASE_URL = 'http://127.0.0.1:8787';

const configuredBackendBaseUrl = process.env.EXPO_PUBLIC_QUINN_BACKEND_BASE_URL;
const useLocalWebBackend =
  Platform.OS === 'web' &&
  process.env.NODE_ENV !== 'production' &&
  !configuredBackendBaseUrl;

const QUINN_PUBLIC_BACKEND_BASE_URL =
  configuredBackendBaseUrl ||
  (useLocalWebBackend ? LOCAL_WEB_BACKEND_BASE_URL : PRODUCTION_BACKEND_BASE_URL);

export const QUINN_BACKEND_BASE_URL = QUINN_PUBLIC_BACKEND_BASE_URL;

export function buildQuinnBackendUrl(path: string): string {
  const cleanPath = String(path || '').startsWith('/') ? path : `/${path}`;
  return `${QUINN_BACKEND_BASE_URL}${cleanPath}`;
}
