import { convexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";

export interface ParticipationRequest {
  id: number;
  project: any;
  project_title?: string;
  project_image?: string;
  volunteer: number;
  volunteer_name?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REFUSED' | 'CANCELLED' | 'EXPIRED';
  motivation: string;
  proposed_start_date?: string;
  proposed_end_date?: string;
  requested_start_date?: string;
  requested_end_date?: string;
  host_response?: string;
  message?: string;
  host_response_message?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateParticipationData {
  project: number | string;
  motivation: string;
  proposed_start_date?: string;
  proposed_end_date?: string;
}

export const participationsService = {
  async getMyParticipations(): Promise<ParticipationRequest[]> {
    const token = getSessionToken();
    if (!token) return [];
    const results = await convexClient.query(api.participations.getMyRequests, { token });
    return results as any;
  },

  async getReceivedRequests(): Promise<ParticipationRequest[]> {
    const token = getSessionToken();
    if (!token) return [];
    const results = await convexClient.query(api.participations.getReceivedRequests, { token });
    return results as any;
  },

  async createRequest(data: CreateParticipationData): Promise<ParticipationRequest> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    const id = await convexClient.mutation(api.participations.create, {
      token,
      projectId: data.project as any,
      motivation: data.motivation,
      proposedStartDate: data.proposed_start_date,
      proposedEndDate: data.proposed_end_date,
    });
    return { id } as any;
  },

  async acceptRequest(id: number | string): Promise<ParticipationRequest> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.participations.accept, {
      token,
      requestId: id as any,
    });
    return { id } as any;
  },

  async refuseRequest(id: number | string): Promise<ParticipationRequest> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.participations.refuse, {
      token,
      requestId: id as any,
    });
    return { id } as any;
  },

  async cancelRequest(id: number | string): Promise<ParticipationRequest> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.participations.cancel, {
      token,
      requestId: id as any,
    });
    return { id } as any;
  },
};
