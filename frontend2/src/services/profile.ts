import { convexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";
import type { User } from '../types';

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  bio?: string;
  date_of_birth?: string;
  phone_number?: string;
  profile_picture?: File;
  languages?: string[];
  skill_codes?: string[];
  address?: {
    city?: string;
    postal_code?: string;
    country_code?: string;
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

    // TODO: Handle profile_picture upload via Convex storage
    await convexClient.mutation(api.users.updateProfile, {
      token,
      firstName: data.first_name,
      lastName: data.last_name,
      bio: data.bio,
      dateOfBirth: data.date_of_birth,
      city: data.address?.city,
      postalCode: data.address?.postal_code,
      countryCode: data.address?.country_code,
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
