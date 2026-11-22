import { authService } from '../features/auth/services/authService';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

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
    authService.logout();
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
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