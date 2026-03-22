import api from './api';
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
  // Get paginated list of projects
  async getProjects(filters?: ProjectFilters): Promise<PaginatedResponse<Project>> {
    const response = await api.get('/projects/', { params: filters });
    return response.data;
  },

  // Get single project by ID
  async getProject(id: number): Promise<Project> {
    const response = await api.get(`/projects/${id}/`);
    return response.data;
  },

  // Create new project
  async createProject(data: Partial<Project>): Promise<Project> {
    const response = await api.post('/projects/', data);
    return response.data;
  },

  // Update project
  async updateProject(id: number, data: Partial<Project>): Promise<Project> {
    const response = await api.patch(`/projects/${id}/`, data);
    return response.data;
  },

  // Delete project
  async deleteProject(id: number): Promise<void> {
    await api.delete(`/projects/${id}/`);
  },

  // Get projects for map view
  async getMapData(filters?: ProjectFilters): Promise<Project[]> {
    const response = await api.get('/projects/map-data/', { params: filters });
    return response.data;
  },

  // Upload project image
  async uploadImage(projectId: number, file: File, isCover = false): Promise<void> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('is_cover', String(isCover));

    await api.post(`/projects/${projectId}/upload-image/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Flag project (community moderation)
  async flagProject(id: number, reason: string): Promise<void> {
    await api.post(`/projects/${id}/flag/`, { reason });
  },

  // Get user's own projects
  async getMyProjects(): Promise<Project[]> {
    const response = await api.get('/projects/my-projects/');
    return response.data.results || response.data;
  },
};
