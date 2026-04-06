import { convexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";
import type { Project } from '../types';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ProjectFilters {
  keyword?: string;
  skills?: string;
  countries?: string;
  availableFrom?: string;
  internet?: string;
  familyFriendly?: string;
  petsAllowed?: string;
  smokingAllowed?: string;
  projectType?: 'PERM' | 'NATB';
  excludeOwn?: boolean;
  page?: number;
}

export const projectsService = {
  async getProjects(filters?: ProjectFilters): Promise<PaginatedResponse<Project>> {
    const convexFilters: any = {};
    if (filters?.keyword) convexFilters.keyword = filters.keyword;
    if (filters?.skills) convexFilters.skills = filters.skills.split(",");
    if (filters?.countries) convexFilters.countries = filters.countries.split(",");
    if (filters?.projectType) convexFilters.projectType = filters.projectType;
    if (filters?.internet === "true") convexFilters.internetProvided = true;
    if (filters?.familyFriendly === "true") convexFilters.familyFriendly = true;
    if (filters?.petsAllowed === "true") convexFilters.petsAllowed = true;
    if (filters?.smokingAllowed === "true") convexFilters.smokingAllowed = true;

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
      projectType: data.projectType,
      hoursPerDay: data.hoursPerDay,
      daysPerWeek: data.daysPerWeek,
      maxHelpers: data.maxHelpers,
      accommodationDetails: data.accommodationDetails,
      foodDetails: data.foodDetails,
      internetProvided: data.internetProvided ?? false,
      familyFriendly: data.familyFriendly ?? false,
      petsAllowed: data.petsAllowed ?? false,
      smokingAllowed: data.smokingAllowed ?? false,
      skillCodes: data.skills || [],
      city: data.address?.city,
      postalCode: data.address?.postalCode,
      countryCode: data.address?.countryCode,
      latitude: data.address?.latitude,
      longitude: data.address?.longitude,
      formattedAddress: data.address?.formattedAddress,
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
      hoursPerDay: data.hoursPerDay,
      daysPerWeek: data.daysPerWeek,
      maxHelpers: data.maxHelpers,
      accommodationDetails: data.accommodationDetails,
      foodDetails: data.foodDetails,
      internetProvided: data.internetProvided,
      familyFriendly: data.familyFriendly,
      petsAllowed: data.petsAllowed,
      smokingAllowed: data.smokingAllowed,
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

  async saveAvailability(
    projectId: string,
    year: number,
    months: {
      january: boolean; february: boolean; march: boolean; april: boolean;
      may: boolean; june: boolean; july: boolean; august: boolean;
      september: boolean; october: boolean; november: boolean; december: boolean;
    }
  ): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.projects.setAvailabilities, {
      token,
      projectId: projectId as any,
      year,
      months,
    });
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
