const QUINN_PUBLIC_BACKEND_BASE_URL = 'https://quinnosbackend-production.up.railway.app';

export const QUINN_BACKEND_BASE_URL = QUINN_PUBLIC_BACKEND_BASE_URL;

export function buildQuinnBackendUrl(path: string): string {
  const cleanPath = String(path || '').startsWith('/') ? path : `/${path}`;
  return `${QUINN_BACKEND_BASE_URL}${cleanPath}`;
}
