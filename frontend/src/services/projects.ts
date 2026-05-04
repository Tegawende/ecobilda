import { convexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";
import type { Project } from '../types';

// ============================================
// projects.ts — service for the host's PLACE container.
// (Bookable units are now in services/missions.ts.)
// ============================================

export interface CreatePlaceData {
  title: string;
  accommodationDetails?: string;
  foodDetails?: string;
  internetProvided: boolean;
  familyFriendly: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  languageCodes?: string[];
  address?: {
    city?: string;
    postalCode?: string;
    countryCode?: string;
    latitude?: number;
    longitude?: number;
    formattedAddress?: string;
  };
}

export const projectsService = {
  async getProject(id: string): Promise<Project> {
    const result = await convexClient.query(api.projects.getById, { id: id as any });
    if (!result) throw new Error("Place not found");
    return result as any;
  },

  async getMyPlaces(): Promise<Project[]> {
    const token = getSessionToken();
    if (!token) return [];
    const results = await convexClient.query(api.projects.getMyPlaces, { token });
    return results as any;
  },

  // Backwards-compat alias for any UI still calling getMyProjects
  async getMyProjects(): Promise<Project[]> {
    return this.getMyPlaces();
  },

  async createProject(data: CreatePlaceData): Promise<Project> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");

    const projectId = await convexClient.mutation(api.projects.create, {
      token,
      title: data.title,
      accommodationDetails: data.accommodationDetails,
      foodDetails: data.foodDetails,
      internetProvided: data.internetProvided ?? false,
      familyFriendly: data.familyFriendly ?? false,
      petsAllowed: data.petsAllowed ?? false,
      smokingAllowed: data.smokingAllowed ?? false,
      languageCodes: data.languageCodes || [],
      city: data.address?.city,
      postalCode: data.address?.postalCode,
      countryCode: data.address?.countryCode,
      latitude: data.address?.latitude,
      longitude: data.address?.longitude,
      formattedAddress: data.address?.formattedAddress,
    });

    return await this.getProject(projectId);
  },

  async updateProject(id: string, data: Partial<CreatePlaceData>): Promise<Project> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");

    await convexClient.mutation(api.projects.update, {
      token,
      id: id as any,
      title: data.title,
      accommodationDetails: data.accommodationDetails,
      foodDetails: data.foodDetails,
      internetProvided: data.internetProvided,
      familyFriendly: data.familyFriendly,
      petsAllowed: data.petsAllowed,
      smokingAllowed: data.smokingAllowed,
      languageCodes: data.languageCodes,
    });

    return await this.getProject(id);
  },

  async deleteProject(id: string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.projects.remove, { token, id: id as any });
  },

  async uploadImage(projectId: string, file: File, isCover = false): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");

    const uploadUrl = await convexClient.mutation(api.projects.generateUploadUrl, { token });
    const uploadResult = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await uploadResult.json();

    await convexClient.mutation(api.projects.saveProjectImage, {
      token,
      projectId: projectId as any,
      storageId,
      order: isCover ? 0 : 999,
    });
  },

  async removeImage(imageId: string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.projects.removeProjectImage, {
      token,
      imageId: imageId as any,
    });
  },

  async reorderImages(projectId: string, imageIds: string[]): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.projects.reorderProjectImages, {
      token,
      projectId: projectId as any,
      imageIds: imageIds as any,
    });
  },

  async flagProject(id: string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.projects.flag, { token, id: id as any });
  },
};
