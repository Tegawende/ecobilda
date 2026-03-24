import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let accessToken: string | null = localStorage.getItem('admin_access_token');

export function setAuthTokens(tokens: { access: string; refresh: string }) {
  accessToken = tokens.access;
  localStorage.setItem('admin_access_token', tokens.access);
  localStorage.setItem('admin_refresh_token', tokens.refresh);
}

export function clearAuthTokens() {
  accessToken = null;
  localStorage.removeItem('admin_access_token');
  localStorage.removeItem('admin_refresh_token');
}

export function getAccessToken() {
  return accessToken;
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('admin_refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          accessToken = access;
          localStorage.setItem('admin_access_token', access);
          originalRequest.headers.Authorization = `Bearer ${access}`;

          return api(originalRequest);
        } catch (refreshError) {
          clearAuthTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API types
export interface DashboardStats {
  users: {
    total: number;
    new_this_month: number;
    with_projects: number;
  };
  projects: {
    total: number;
    active: number;
    pending: number;
    rejected: number;
    new_this_month: number;
  };
  participations: {
    total: number;
    pending: number;
    accepted: number;
    refused: number;
    new_this_month: number;
    conversion_rate: number;
  };
  reviews: {
    total: number;
    average_rating: number;
    new_this_month: number;
  };
  reports: {
    total: number;
    pending: number;
    resolved: number;
    dismissed: number;
  };
  messages: {
    total: number;
  };
  favorites: {
    total: number;
  };
  top_countries: Array<{
    address__country__name: string;
    address__country__code: string;
    count: number;
  }>;
  popular_skills: Array<{
    code: string;
    display_name_en: string;
    display_name_fr: string;
    project_count: number;
  }>;
  activity: {
    users_by_day: Array<{ date: string; count: number }>;
    projects_by_day: Array<{ date: string; count: number }>;
  };
}

export interface PendingProject {
  id: number;
  title: string;
  owner: {
    id: number;
    email: string;
    full_name: string;
  };
  project_type: string;
  created_at: string;
  city?: string;
  country?: string;
}

export interface Report {
  id: number;
  reporter_email: string;
  reporter_name: string;
  target_type: string;
  target_type_display: string;
  target_id: number;
  reason: string;
  reason_display: string;
  details: string;
  status: string;
  status_display: string;
  created_at: string;
}

export interface ProjectImage {
  id: number;
  image: string;
  is_cover: boolean;
  order: number;
  uploaded_at: string;
}

export interface ProjectDetail {
  id: number;
  title: string;
  description: string;
  project_type: string;
  project_type_display: string;
  status: string;
  status_display: string;
  owner: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
  address: {
    street?: string;
    city: string;
    postal_code?: string;
    country: {
      code: string;
      name: string;
    };
    latitude?: number;
    longitude?: number;
  };
  images: ProjectImage[];
  skills: Array<{
    code: string;
    display_name_en: string;
    display_name_fr: string;
    category: string;
  }>;
  // Work details
  hours_per_day?: number;
  days_per_week?: number;
  min_stay_weeks?: number;
  max_helpers?: number;
  // Amenities
  wifi_available: boolean;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  family_friendly: boolean;
  wheelchair_accessible: boolean;
  // Accommodation
  accommodation_provided: boolean;
  accommodation_description?: string;
  meals_provided: boolean;
  meals_description?: string;
  // Dates
  created_at: string;
  updated_at: string;
  validated_at?: string;
}

export interface AdminNotificationSettings {
  notify_new_user: boolean;
  notify_new_project: boolean;
  notify_new_report: boolean;
  notify_new_participation: boolean;
}

export interface AdminUserDetail {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string;
  bio: string;
  profile_picture: string | null;
  profile_picture_url: string | null;
  email_verified: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  email_notifications: boolean;
  newsletter: boolean;
  in_app_notifications: boolean;
  notification_language: string;
  average_rating: number;
  review_count: number;
  date_joined: string;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  address: {
    id: number;
    city: string;
    street: string;
    street_number: string;
    postal_code: string;
    country: { code: string; name: string } | null;
    latitude: string;
    longitude: string;
    formatted_address: string;
  } | null;
  languages: Array<{ code: string; name: string }>;
  skills: Array<{
    code: string;
    display_name_en: string;
    display_name_fr: string;
    category: string;
  }>;
  projects_count: number;
  projects: Array<{
    id: number;
    title: string;
    status: string;
    project_type: string;
    created_at: string;
  }>;
  reviews_received: Array<{
    id: number;
    writer: string;
    rating: number;
    feedback: string;
    created_at: string;
  }>;
  favorites_count: number;
}

// Admin API functions
export const adminApi = {
  // Generic get for flexible queries
  async get<T>(url: string): Promise<T> {
    const response = await api.get(url);
    return response.data;
  },

  // Dashboard
  async getStats(): Promise<DashboardStats> {
    const response = await api.get('/admin/stats/dashboard/');
    return response.data;
  },

  // Projects
  async getPendingProjects(): Promise<PendingProject[]> {
    const response = await api.get('/admin/projects/pending/');
    return response.data;
  },

  async getValidatedProjects(): Promise<PendingProject[]> {
    const response = await api.get('/admin/projects/validated/');
    return response.data;
  },

  async validateProject(id: number): Promise<void> {
    await api.post(`/admin/projects/${id}/validate/`);
  },

  async invalidateProject(id: number, reason?: string): Promise<void> {
    await api.post(`/admin/projects/${id}/invalidate/`, { reason });
  },

  async rejectProject(id: number, reason: string): Promise<void> {
    await api.post(`/admin/projects/${id}/reject/`, { reason });
  },

  async getProjectDetail(id: number): Promise<ProjectDetail> {
    const response = await api.get(`/admin/projects/${id}/`);
    return response.data;
  },

  // Reports
  async getReports(status?: string): Promise<{ count: number; results: Report[] }> {
    const params = status ? { status } : {};
    const response = await api.get('/admin/reports/', { params });
    return response.data;
  },

  async getPendingReports(): Promise<{ count: number; results: Report[] }> {
    const response = await api.get('/admin/reports/pending/');
    return response.data;
  },

  async resolveReport(id: number, action: 'resolve' | 'dismiss', notes?: string): Promise<void> {
    await api.post(`/admin/reports/${id}/resolve/`, { action, notes });
  },

  // Users
  async getUserDetail(id: number): Promise<AdminUserDetail> {
    const response = await api.get(`/admin/users/${id}/detail/`);
    return response.data;
  },

  async blockUser(id: number, reason?: string): Promise<void> {
    await api.post(`/admin/users/${id}/block/`, { reason });
  },

  async unblockUser(id: number): Promise<void> {
    await api.post(`/admin/users/${id}/unblock/`);
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/admin/users/${id}/`);
  },

  async verifyUserEmail(id: number): Promise<void> {
    await api.post(`/admin/users/${id}/verify-email/`);
  },

  async unverifyUserEmail(id: number): Promise<void> {
    await api.post(`/admin/users/${id}/unverify-email/`);
  },

  // Auth
  async login(email: string, password: string): Promise<{ tokens: { access: string; refresh: string }; user: unknown }> {
    const response = await api.post('/auth/login/', { email, password });
    return response.data;
  },

  async getCurrentUser(): Promise<unknown> {
    const response = await api.get('/auth/me/');
    return response.data;
  },

  // Settings
  async getNotificationSettings(): Promise<AdminNotificationSettings> {
    const response = await api.get('/admin/settings/notifications/');
    return response.data;
  },

  async updateNotificationSettings(settings: AdminNotificationSettings): Promise<void> {
    await api.put('/admin/settings/notifications/', settings);
  },
};
