import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../features/auth/services/authService';

const mockUser = {
  id: 'usr_123',
  name: 'Ravi Gahire',
  email: 'ravi@example.com',
  currency: 'INR',
};

describe('authService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('sends credentials to POST /auth/login and stores token + user in localStorage', async () => {
      const mockResponse = { token: 'jwt-token-123', user: mockUser };

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await authService.login({
        email: 'ravi@example.com',
        password: 'Password@123',
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\/auth\/login$/),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'ravi@example.com',
            password: 'Password@123',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
      expect(authService.getToken()).toBe('jwt-token-123');
      expect(authService.getStoredUser()).toEqual(mockUser);
    });

    it('throws the server error message when login fails (401)', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid email or password' }),
      } as Response);

      await expect(
        authService.login({
          email: 'ravi@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid email or password');

      expect(authService.getToken()).toBeNull();
    });
  });

  describe('register', () => {
    it('sends payload to POST /auth/register and persists session', async () => {
      const mockResponse = { token: 'jwt-new-user', user: mockUser };

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      } as Response);

      const payload = {
        name: 'Ravi Gahire',
        email: 'ravi@example.com',
        password: 'Password@123',
        currency: 'INR',
      };

      const result = await authService.register(payload);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\/auth\/register$/),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        })
      );
      expect(result).toEqual(mockResponse);
      expect(authService.getToken()).toBe('jwt-new-user');
      expect(authService.getStoredUser()).toEqual(mockUser);
    });

    it('throws conflict message when email already exists (409)', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          message: 'An account with this email already exists',
        }),
      } as Response);

      await expect(
        authService.register({
          name: 'Ravi Gahire',
          email: 'ravi@example.com',
          password: 'Password@123',
          currency: 'INR',
        })
      ).rejects.toThrow('An account with this email already exists');
    });
  });

  describe('getCurrentUser', () => {
    it('returns null without calling fetch when no token exists', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const user = await authService.getCurrentUser();

      expect(user).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('clears storage and returns null when token is expired (401)', async () => {
      localStorage.setItem('expense_tracker_token', 'expired-token');
      localStorage.setItem('expense_tracker_user', JSON.stringify(mockUser));

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid or expired authentication token' }),
      } as Response);

      const user = await authService.getCurrentUser();

      expect(user).toBeNull();
      expect(authService.getToken()).toBeNull();
      expect(authService.getStoredUser()).toBeNull();
    });
  });
});