import { convexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";
import type { Project, PaginatedResponse } from '../types';

export interface ProjectFilters {
  keyword?: string;
  skills?: string;
  countries?: string;
  available_from?: string;
  internet?: string;
  family_friendly?: string;
  pets_allowed?: string;
  smoking_allowed?: string;
  project_type?: 'PERM' | 'NATB';
  exclude_own?: boolean;
  page?: number;
}

export const projectsService = {
  async getProjects(filters?: ProjectFilters): Promise<PaginatedResponse<Project>> {
    const convexFilters: any = {};
    if (filters?.keyword) convexFilters.keyword = filters.keyword;
    if (filters?.skills) convexFilters.skills = filters.skills.split(",");
    if (filters?.countries) convexFilters.countries = filters.countries.split(",");
    if (filters?.project_type) convexFilters.projectType = filters.project_type;
    if (filters?.internet === "true") convexFilters.internetProvided = true;
    if (filters?.family_friendly === "true") convexFilters.familyFriendly = true;
    if (filters?.pets_allowed === "true") convexFilters.petsAllowed = true;
    if (filters?.smoking_allowed === "true") convexFilters.smokingAllowed = true;

    const results = await convexClient.query(api.projects.list, convexFilters);
    return {
      count: results.length,
      next: null,
      previous: null,
      results: results as any,
    };
  },

  async getProject(id: number | string): Promise<Project> {
    const result = await convexClient.query(api.projects.getById, { id: id as any });
    if (!result) throw new Error("Project not found");
    return result as any;
  },

  async createProject(data: any): Promise<Project> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");

    const projectId = await convexClient.mutation(api.projects.create, {
      token,
      title: data.title,
      description: data.description,
      projectType: data.project_type,
      hoursPerDay: data.hours_per_day,
      daysPerWeek: data.days_per_week,
      maxHelpers: data.max_helpers,
      accommodationDetails: data.accommodation_details,
      foodDetails: data.food_details,
      internetProvided: data.internet_provided ?? false,
      familyFriendly: data.family_friendly ?? false,
      petsAllowed: data.pets_allowed ?? false,
      smokingAllowed: data.smoking_allowed ?? false,
      skillCodes: data.skills || [],
      city: data.address?.city,
      postalCode: data.address?.postal_code,
      countryCode: data.address?.country_code,
      latitude: data.address?.latitude,
      longitude: data.address?.longitude,
      formattedAddress: data.address?.formatted_address,
    });

    return await this.getProject(projectId);
  },

  async updateProject(id: number | string, data: any): Promise<Project> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");

    await convexClient.mutation(api.projects.update, {
      token,
      id: id as any,
      title: data.title,
      description: data.description,
      hoursPerDay: data.hours_per_day,
      daysPerWeek: data.days_per_week,
      maxHelpers: data.max_helpers,
      accommodationDetails: data.accommodation_details,
      foodDetails: data.food_details,
      internetProvided: data.internet_provided,
      familyFriendly: data.family_friendly,
      petsAllowed: data.pets_allowed,
      smokingAllowed: data.smoking_allowed,
      skillCodes: data.skills,
    });

    return await this.getProject(id);
  },

  async deleteProject(id: number | string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.projects.remove, { token, id: id as any });
  },

  async getMapData(): Promise<any[]> {
    return await convexClient.query(api.projects.getMapData);
  },

  async uploadImage(projectId: number | string, file: File, isCover = false): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");

    // Get upload URL from Convex
    const uploadUrl = await convexClient.mutation(api.projects.generateUploadUrl, { token });

    // Upload file
    const uploadResult = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await uploadResult.json();

    // Save to project
    await convexClient.mutation(api.projects.saveProjectImage, {
      token,
      projectId: projectId as any,
      storageId,
      order: isCover ? 0 : 999,
    });
  },

  async flagProject(id: number | string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.projects.flag, { token, id: id as any });
  },

  async getMyProjects(): Promise<Project[]> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    const results = await convexClient.query(api.projects.getMyProjects, { token });
    return results as any;
  },
};
