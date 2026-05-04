import { convexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";

export interface CreateParticipationData {
  missionId: string;
  motivation: string;
  proposedStartDate?: string;
  proposedEndDate?: string;
}

export const participationsService = {
  async getParticipationById(id: string): Promise<any> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    return await convexClient.query(api.participations.getById, { token, id: id as any });
  },

  async getMyParticipations(): Promise<any[]> {
    const token = getSessionToken();
    if (!token) return [];
    const results = await convexClient.query(api.participations.getMyRequests, { token });
    return results as any;
  },

  async getReceivedRequests(): Promise<any[]> {
    const token = getSessionToken();
    if (!token) return [];
    const results = await convexClient.query(api.participations.getReceivedRequests, { token });
    return results as any;
  },

  async createRequest(data: CreateParticipationData): Promise<any> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    const res = await convexClient.mutation(api.participations.create, {
      token,
      missionId: data.missionId as any,
      motivation: data.motivation,
      proposedStartDate: data.proposedStartDate,
      proposedEndDate: data.proposedEndDate,
    });
    return res as any;
  },

  async acceptRequest(id: string, responseMessage?: string): Promise<any> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.participations.accept, {
      token,
      requestId: id as any,
      responseMessage,
    });
    return { id };
  },

  async refuseRequest(id: string, responseMessage?: string): Promise<any> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.participations.refuse, {
      token,
      requestId: id as any,
      responseMessage,
    });
    return { id };
  },

  async cancelRequest(id: string): Promise<any> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.participations.cancel, {
      token,
      requestId: id as any,
    });
    return { id };
  },
};
