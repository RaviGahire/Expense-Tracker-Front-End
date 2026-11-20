import type {
  AuthResponse,
  LoginCredentials,
  RegisterPayload,
  User,
} from '../types/auth.types';

const TOKEN_KEY = 'expense_tracker_token';
const USER_KEY = 'expense_tracker_user';
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function saveSession(data: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export const authService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password.');
      }

      saveSession(data);
      return data;
    }

    // Simulated API response while backend is offline
    await new Promise((resolve) => setTimeout(resolve, 500));
    const storedUser = this.getStoredUser();
    const mockAuth: AuthResponse = {
      token: 'mock-jwt-token',
      user:
        storedUser && storedUser.email === credentials.email
          ? storedUser
          : {
              id: 'usr_1',
              name: credentials.email.split('@')[0],
              email: credentials.email,
              currency: 'INR',
            },
    };

    saveSession(mockAuth);
    return mockAuth;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      saveSession(data);
      return data;
    }

    // Simulated API response while backend is offline
    await new Promise((resolve) => setTimeout(resolve, 500));
    const mockAuth: AuthResponse = {
      token: 'mock-jwt-token',
      user: {
        id: `usr_${Date.now()}`,
        name: payload.name,
        email: payload.email,
        currency: payload.currency,
      },
    };

    saveSession(mockAuth);
    return mockAuth;
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};