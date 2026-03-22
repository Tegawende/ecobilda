import api from './api';

export interface ParticipationRequest {
  id: number;
  project: any; // Can be a number (ID) or full Project object depending on endpoint
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
  project: number;
  motivation: string;
  proposed_start_date?: string;
  proposed_end_date?: string;
}

export const participationsService = {
  // Get my participation requests (as volunteer)
  async getMyParticipations(): Promise<ParticipationRequest[]> {
    const response = await api.get('/participations/');
    return response.data.results || response.data;
  },

  // Get requests received (as host)
  async getReceivedRequests(): Promise<ParticipationRequest[]> {
    const response = await api.get('/participations/received/');
    return response.data.results || response.data;
  },

  // Create a participation request
  async createRequest(data: CreateParticipationData): Promise<ParticipationRequest> {
    const response = await api.post('/participations/', data);
    return response.data;
  },

  // Accept a request (host action)
  async acceptRequest(id: number): Promise<ParticipationRequest> {
    const response = await api.post(`/participations/${id}/accept/`);
    return response.data;
  },

  // Refuse a request (host action)
  async refuseRequest(id: number): Promise<ParticipationRequest> {
    const response = await api.post(`/participations/${id}/refuse/`);
    return response.data;
  },

  // Cancel a request (volunteer action)
  async cancelRequest(id: number): Promise<ParticipationRequest> {
    const response = await api.post(`/participations/${id}/cancel/`);
    return response.data;
  },
};
