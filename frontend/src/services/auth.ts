import api, { setAuthTokens, clearAuthTokens } from './api';
import type { LoginCredentials, RegisterData, AuthTokens, User } from '../types';

export const authService = {
  // Email/Password authentication
  async login(credentials: LoginCredentials): Promise<{ tokens: AuthTokens; user: User }> {
    const response = await api.post('/auth/login/', credentials);
    const { tokens, user } = response.data;
    setAuthTokens(tokens);
    return { tokens, user };
  },

  async register(data: RegisterData): Promise<{ tokens: AuthTokens; user: User }> {
    const response = await api.post('/auth/register/', data);
    const { tokens, user } = response.data;
    setAuthTokens(tokens);
    return { tokens, user };
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout/');
    } finally {
      clearAuthTokens();
    }
  },

  // Google OAuth
  async googleLogin(credential: string): Promise<{ tokens: AuthTokens; user: User }> {
    const response = await api.post('/auth/google/', { credential });
    const { access, refresh, user } = response.data;
    const tokens = { access, refresh };
    setAuthTokens(tokens);
    return { tokens, user };
  },

  // Apple OAuth
  async appleLogin(credential: string): Promise<{ tokens: AuthTokens; user: User }> {
    const response = await api.post('/auth/apple/', { credential });
    const { access, refresh, user } = response.data;
    const tokens = { access, refresh };
    setAuthTokens(tokens);
    return { tokens, user };
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me/');
    return response.data;
  },

  // Password reset
  async requestPasswordReset(email: string): Promise<void> {
    await api.post('/auth/password-reset/', { email });
  },

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    await api.post('/auth/password-reset/confirm/', {
      token,
      password: newPassword,
    });
  },
};
