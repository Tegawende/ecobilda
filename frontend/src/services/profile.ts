import { convexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";
import type { User } from '../types';

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  dateOfBirth?: string;
  profilePicture?: File;
  languages?: string[];
  languageCodes?: string[];
  skillCodes?: string[];
  city?: string;
  postalCode?: string;
  countryCode?: string;
  address?: {
    city?: string;
    postalCode?: string;
    countryCode?: string;
  };
}

export const profileService = {
  async getProfile(): Promise<User> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    const user = await convexClient.query(api.auth.me, { token });
    if (!user) throw new Error("Not authenticated");
    return user as any;
  },

  async updateProfile(data: UpdateProfileData): Promise<User> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");

    // Handle profile picture upload if provided
    if (data.profilePicture) {
      await this.uploadProfilePicture(data.profilePicture);
    }

    // Resolve address fields (accept both flat and nested)
    const city = data.city ?? data.address?.city;
    const postalCode = data.postalCode ?? data.address?.postalCode;
    const countryCode = data.countryCode ?? data.address?.countryCode;

    await convexClient.mutation(api.users.updateProfile, {
      token,
      firstName: data.firstName,
      lastName: data.lastName,
      bio: data.bio,
      dateOfBirth: data.dateOfBirth,
      skillCodes: data.skillCodes,
      languageCodes: data.languageCodes ?? data.languages,
      city,
      postalCode,
      countryCode,
    });

    return await this.getProfile();
  },

  async updateSettings(data: {
    emailNotifications?: boolean;
    newsletter?: boolean;
    inAppNotifications?: boolean;
    notificationLanguage?: string;
  }): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.users.updateSettings, { token, ...data });
  },

  async uploadProfilePicture(file: File): Promise<User> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");

    // 1. Get upload URL
    const uploadUrl = await convexClient.mutation(api.projects.generateUploadUrl, { token });

    // 2. Upload file to Convex storage
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await result.json();

    // 3. Save storage ID to user profile
    await convexClient.mutation(api.users.updateProfilePicture, { token, storageId });

    return await this.getProfile();
  },
};
