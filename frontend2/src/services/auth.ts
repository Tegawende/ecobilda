import api, { setAuthTokens, clearAuthTokens } from './api';
import type { LoginCredentials, AuthTokens, User } from '../types';

export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  locale?: string;
}

export const authService = {
  // Email/Password authentication
  async login(credentials: LoginCredentials): Promise<{ tokens: AuthTokens; user: User }> {
    const response = await api.post('/auth/login/', credentials);
    const { tokens, user } = response.data;
    setAuthTokens(tokens);
    return { tokens, user };
  },

  async register(data: RegisterData): Promise<{ message: string; email: string }> {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout/');
    } finally {
      clearAuthTokens();
    }
  },

  // Google OAuth
  async googleLogin(accessToken: string): Promise<{ tokens: AuthTokens; user: User; created: boolean }> {
    const response = await api.post('/auth/google/', { access_token: accessToken });
    const { tokens, user, created } = response.data;
    setAuthTokens(tokens);
    return { tokens, user, created };
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
      password_confirm: newPassword,
    });
  },

  // Email verification
  async verifyEmail(token: string) {
    return api.post('/auth/verify-email/', { token });
  },

  async sendVerificationEmail(): Promise<void> {
    await api.post('/auth/send-verification-email/');
  },

  // Check if email exists
  async checkEmail(email: string): Promise<{ exists: boolean; has_password: boolean }> {
    const response = await api.post('/auth/check-email/', { email });
    return response.data;
  },

  // Change password
  async changePassword(data: { current_password: string; new_password: string; confirm_password: string }): Promise<void> {
    await api.post('/auth/change-password/', data);
  },
};
