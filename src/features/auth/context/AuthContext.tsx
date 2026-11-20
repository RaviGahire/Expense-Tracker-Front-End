import {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authService } from '../services/authService';

import type {
  LoginCredentials,
  RegisterPayload,
  User,
} from '../types/auth.types';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = authService.getToken();
    const storedUser = authService.getStoredUser();
    if (token && storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const data = await authService.login(credentials);
    setUser(data.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const data = await authService.register(payload);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}