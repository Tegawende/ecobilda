import api from './api';
import type { User } from '../types';

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  bio?: string;
  date_of_birth?: string;
  phone_number?: string;
  profile_picture?: File;
  languages?: number[]; // Language IDs
  skills?: string[]; // Skill codes
  address?: {
    city?: string;
    postal_code?: string;
    country_code?: string;
  };
}

export const profileService = {
  // Get current user's profile
  async getProfile(): Promise<User> {
    const response = await api.get('/profile/');
    return response.data;
  },

  // Update current user's profile
  async updateProfile(data: UpdateProfileData): Promise<User> {
    const formData = new FormData();

    // Add all non-file fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'profile_picture' && value instanceof File) {
        formData.append('profile_picture', value);
      } else if (key === 'address' && typeof value === 'object') {
        // Flatten address object
        Object.entries(value).forEach(([addrKey, addrValue]) => {
          if (addrValue !== undefined) {
            formData.append(`address.${addrKey}`, String(addrValue));
          }
        });
      } else if (Array.isArray(value)) {
        // Handle arrays (languages, skills)
        value.forEach((item) => formData.append(key, String(item)));
      } else if (value !== undefined) {
        formData.append(key, String(value));
      }
    });

    const response = await api.patch('/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload/update profile picture
  async uploadProfilePicture(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('profile_picture', file);

    const response = await api.patch('/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
