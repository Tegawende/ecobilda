import { convexClient, getSessionToken, setSessionToken, clearSessionToken } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";
import type { LoginCredentials, AuthTokens, User } from '../types';

export interface RegisterData {
  email: string;
  password: string;
  passwordConfirm: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  locale?: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ tokens: AuthTokens; user: User }> {
    const result = await convexClient.mutation(api.auth.login, {
      email: credentials.email,
      password: credentials.password,
    });
    setSessionToken(result.token);
    return {
      tokens: { access: result.token, refresh: "" },
      user: result.user as any,
    };
  },

  async register(data: RegisterData): Promise<{ message: string; email: string }> {
    const result = await convexClient.mutation(api.auth.register, {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      locale: data.locale,
    });
    return { message: result.message, email: data.email };
  },

  async logout(): Promise<void> {
    const token = getSessionToken();
    if (token) {
      try {
        await convexClient.mutation(api.auth.logout, { token });
      } catch {
        // Ignore
      }
    }
    clearSessionToken();
  },

  async googleLogin(accessToken: string): Promise<{ tokens: AuthTokens; user: User; created: boolean }> {
    // Get user info from Google
    const googleResponse = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const googleUser = await googleResponse.json();

    const result = await convexClient.mutation(api.auth.googleLogin, {
      email: googleUser.email,
      firstName: googleUser.given_name || "",
      lastName: googleUser.family_name || "",
      pictureUrl: googleUser.picture,
    });

    setSessionToken(result.token);
    return {
      tokens: { access: result.token, refresh: "" },
      user: result.user as any,
      created: result.created,
    };
  },

  async getCurrentUser(): Promise<User> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    const user = await convexClient.query(api.auth.me, { token });
    if (!user) throw new Error("Not authenticated");
    return user as any;
  },

  async requestPasswordReset(email: string): Promise<void> {
    await convexClient.mutation(api.auth.requestPasswordReset, { email });
  },

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    await convexClient.mutation(api.auth.confirmPasswordReset, { token, newPassword });
  },

  async verifyEmail(token: string) {
    return await convexClient.mutation(api.auth.verifyEmail, { token });
  },

  async sendVerificationEmail(): Promise<void> {
    // TODO: Implement via Convex action
  },

  async checkEmail(email: string): Promise<{ exists: boolean; hasPassword: boolean }> {
    const result = await convexClient.query(api.auth.checkEmail, { email });
    return { exists: result.exists, hasPassword: result.hasPassword };
  },

  async changePassword(data: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.auth.changePassword, {
      token,
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  },
};
