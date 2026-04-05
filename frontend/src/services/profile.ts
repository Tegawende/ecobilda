import { convexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";
import type { User } from '../types';

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  profilePicture?: File;
  languages?: string[];
  skillCodes?: string[];
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

    // TODO: Handle profilePicture upload via Convex storage
    await convexClient.mutation(api.users.updateProfile, {
      token,
      firstName: data.firstName,
      lastName: data.lastName,
      bio: data.bio,
      dateOfBirth: data.dateOfBirth,
      city: data.address?.city,
      postalCode: data.address?.postalCode,
      countryCode: data.address?.countryCode,
    });

    return await this.getProfile();
  },

  async uploadProfilePicture(file: File): Promise<User> {
    // TODO: Implement via Convex file storage
    // 1. Get upload URL: convexClient.mutation(api.projects.generateUploadUrl, { token })
    // 2. Upload file: fetch(uploadUrl, { method: "POST", body: file })
    // 3. Save storage ID to user profile
    return await this.getProfile();
  },
};
