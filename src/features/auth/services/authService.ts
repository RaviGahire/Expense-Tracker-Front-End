import type {
  AuthResponse,
  LoginCredentials,
  RegisterPayload,
  User,
} from '../types/auth.types';

const TOKEN_KEY = 'expense_tracker_token';
const USER_KEY = 'expense_tracker_user';
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function saveSession(data: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export const authService = {
  
  getToken(): string | null {

    const token = localStorage.getItem(TOKEN_KEY);

    // Clear stale offline mock tokens if switching to live backend
    if (API_BASE_URL && token === 'mock-jwt-token') {
      this.logout();
      return null;
    }
    return token;
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

  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
    // await new Promise((resolve) => setTimeout(resolve, 500));

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

  // Register
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
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
    // await new Promise((resolve) => setTimeout(resolve, 500));
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

  // Verify token & restore session from GET /api/v1/auth/me
  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    if (!API_BASE_URL) {
      return this.getStoredUser();
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      this.logout();
      return null;
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user session.');
    }

    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user as User;
  },

  // Update profile via PATCH /api/v1/auth/me
  async updateProfile(updates: {
    name?: string;
    currency?: string;
  }): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated.');
    }

    if (!API_BASE_URL) {
      const current = this.getStoredUser();
      if (!current) throw new Error('User not found.');
      const updated = { ...current, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile.');
    }

    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user as User;
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};