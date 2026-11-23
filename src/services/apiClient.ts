import { authService } from '../features/auth/services/authService';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const PUBLIC_AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

function getAuthToken(): string | null {
  const token = authService.getToken?.();
  if (token) return token;

  // Fallback check if token was saved directly in localStorage
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('accessToken')
  );
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_URL is not configured in .env');
  }

  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const isAuthEndpoint = path.startsWith('/auth/');
    const isOnPublicAuthPage = PUBLIC_AUTH_PATHS.some((publicPath) =>
      window.location.pathname.startsWith(publicPath)
    );

    if (!isAuthEndpoint) {
      authService.logout();
      if (!isOnPublicAuthPage) {
        window.location.replace('/login');
      }
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { message?: string }).message ||
        'Session expired. Please log in again.'
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      (data as { message?: string }).message || 'Request failed'
    );
  }

  return data as T;
}