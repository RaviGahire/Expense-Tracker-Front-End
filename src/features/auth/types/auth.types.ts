export interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
  avatar?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  currency: string;
  password: string;
}