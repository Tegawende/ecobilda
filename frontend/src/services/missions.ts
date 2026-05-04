import { convexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";
import type { Mission, MissionMapPoint } from "@/types";

export interface MissionFilters {
  keyword?: string;
  type?: 'CHANTIER' | 'FORMATION';
  difficulty?: 'DEBUTANT' | 'INTERMEDIAIRE' | 'EXPERT';
  poste?: string;
  technique?: string;
  pricingMode?: 'FREE' | 'PAID';
  skills?: string[];
  countries?: string[];
  languages?: string[];
  startsAfter?: string;
  endsBefore?: string;
  excludeOwner?: string;
}

export interface CreateMissionData {
  projectId: string;
  type: 'CHANTIER' | 'FORMATION';
  title: string;
  description: string;
  poste?: string;
  technique?: string;
  difficulty: 'DEBUTANT' | 'INTERMEDIAIRE' | 'EXPERT';
  pricingMode: 'FREE' | 'PAID';
  priceEUR?: number;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  hoursPerDay: number;
  daysPerWeek: number;
  skillCodes: string[];
}

export const missionsService = {
  async list(filters?: MissionFilters): Promise<Mission[]> {
    const args: any = {};
    if (filters?.keyword) args.keyword = filters.keyword;
    if (filters?.type) args.type = filters.type;
    if (filters?.difficulty) args.difficulty = filters.difficulty;
    if (filters?.poste) args.poste = filters.poste;
    if (filters?.technique) args.technique = filters.technique;
    if (filters?.pricingMode) args.pricingMode = filters.pricingMode;
    if (filters?.skills?.length) args.skills = filters.skills;
    if (filters?.countries?.length) args.countries = filters.countries;
    if (filters?.languages?.length) args.languages = filters.languages;
    if (filters?.startsAfter) args.startsAfter = filters.startsAfter;
    if (filters?.endsBefore) args.endsBefore = filters.endsBefore;
    if (filters?.excludeOwner) args.excludeOwner = filters.excludeOwner;

    const results = await convexClient.query(api.missions.list, args);
    return results as any;
  },

  async getById(id: string): Promise<Mission | null> {
    const result = await convexClient.query(api.missions.getById, { id: id as any });
    return result as any;
  },

  async getByIds(ids: string[]): Promise<Mission[]> {
    const results = await convexClient.query(api.missions.getByIds, { ids: ids as any });
    return results as any;
  },

  async getMyMissions(): Promise<Mission[]> {
    const token = getSessionToken();
    if (!token) return [];
    const results = await convexClient.query(api.missions.getMyMissions, { token });
    return results as any;
  },

  async getMapData(): Promise<MissionMapPoint[]> {
    const results = await convexClient.query(api.missions.getMapData);
    return results as any;
  },

  async getByProject(projectId: string, excludeId?: string): Promise<Mission[]> {
    const args: any = { projectId: projectId as any };
    if (excludeId) args.excludeId = excludeId;
    const results = await convexClient.query(api.missions.getByProject, args);
    return results as any;
  },

  async getCompletedPublic(filters?: { poste?: string; technique?: string; type?: string }): Promise<Mission[]> {
    const args: any = {};
    if (filters?.poste) args.poste = filters.poste;
    if (filters?.technique) args.technique = filters.technique;
    if (filters?.type) args.type = filters.type;
    const results = await convexClient.query(api.missions.getCompletedPublic, args);
    return results as any;
  },

  async create(data: CreateMissionData): Promise<string> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    const id = await convexClient.mutation(api.missions.create, {
      token,
      projectId: data.projectId as any,
      type: data.type,
      title: data.title,
      description: data.description,
      poste: data.poste,
      technique: data.technique,
      difficulty: data.difficulty,
      pricingMode: data.pricingMode,
      priceEUR: data.priceEUR,
      startDate: data.startDate,
      endDate: data.endDate,
      maxParticipants: data.maxParticipants,
      hoursPerDay: data.hoursPerDay,
      daysPerWeek: data.daysPerWeek,
      skillCodes: data.skillCodes,
    });
    return id as any;
  },

  async update(id: string, data: Partial<CreateMissionData>): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.missions.update, {
      token,
      id: id as any,
      title: data.title,
      description: data.description,
      poste: data.poste,
      technique: data.technique,
      difficulty: data.difficulty,
      pricingMode: data.pricingMode,
      priceEUR: data.priceEUR,
      startDate: data.startDate,
      endDate: data.endDate,
      maxParticipants: data.maxParticipants,
      hoursPerDay: data.hoursPerDay,
      daysPerWeek: data.daysPerWeek,
      skillCodes: data.skillCodes,
    });
  },

  async setStatus(
    id: string,
    status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED',
    cancellationReason?: string
  ): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.missions.setStatus, {
      token,
      id: id as any,
      status,
      cancellationReason,
    });
  },

  async remove(id: string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.missions.remove, { token, id: id as any });
  },

  async duplicate(id: string): Promise<string> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    const newId = await convexClient.mutation(api.missions.duplicate, { token, id: id as any });
    return newId as any;
  },

  async uploadImage(missionId: string, file: File, isCover = false): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");

    const uploadUrl = await convexClient.mutation(api.missions.generateUploadUrl, { token });
    const uploadResult = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await uploadResult.json();

    await convexClient.mutation(api.missions.saveMissionImage, {
      token,
      missionId: missionId as any,
      storageId,
      order: isCover ? 0 : 999,
    });
  },

  async removeImage(imageId: string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.missions.removeMissionImage, {
      token,
      imageId: imageId as any,
    });
  },

  async reorderImages(missionId: string, imageIds: string[]): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.missions.reorderMissionImages, {
      token,
      missionId: missionId as any,
      imageIds: imageIds as any,
    });
  },
};
