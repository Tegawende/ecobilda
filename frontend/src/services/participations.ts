import { convexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";

export interface CreateParticipationData {
  project: number | string;
  motivation: string;
  proposedStartDate?: string;
  proposedEndDate?: string;
}

export const participationsService = {
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
    const id = await convexClient.mutation(api.participations.create, {
      token,
      projectId: data.project as any,
      motivation: data.motivation,
      proposedStartDate: data.proposedStartDate,
      proposedEndDate: data.proposedEndDate,
    });
    return { _id: id } as any;
  },

  async acceptRequest(id: number | string): Promise<any> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.participations.accept, {
      token,
      requestId: id as any,
    });
    return { id } as any;
  },

  async refuseRequest(id: number | string): Promise<any> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.participations.refuse, {
      token,
      requestId: id as any,
    });
    return { id } as any;
  },

  async cancelRequest(id: number | string): Promise<any> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.participations.cancel, {
      token,
      requestId: id as any,
    });
    return { id } as any;
  },
};
