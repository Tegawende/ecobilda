import api from './api';
import type { Project, PaginatedResponse } from '../types';

export interface ProjectFilters {
  keyword?: string;
  skills?: string;  // Backend expects comma-separated string
  countries?: string;  // Backend expects comma-separated string
  available_from?: string;
  internet?: string;  // Backend expects 'true'/'false' string
  family_friendly?: string;
  pets_allowed?: string;
  smoking_allowed?: string;
  project_type?: 'PERM' | 'NATB';
  exclude_own?: boolean;  // Exclude user's own projects from results
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
    // Get presigned URL
    const presignResponse = await api.post(`/projects/${projectId}/upload-image/`, {
      filename: file.name,
      is_cover: isCover,
    });

    const { upload_url, fields } = presignResponse.data;

    // Upload directly to S3
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    formData.append('file', file);

    await fetch(upload_url, {
      method: 'POST',
      body: formData,
    });
  },

  // Flag project (community moderation)
  async flagProject(id: number, reason: string): Promise<void> {
    await api.post(`/projects/${id}/flag/`, { reason });
  },
};
