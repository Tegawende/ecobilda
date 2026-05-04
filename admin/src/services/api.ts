import { convexClient, getSessionToken, setSessionToken, clearSessionToken } from '@/lib/convexClient';
import { api } from '@convex/_generated/api';

// Re-export for auth hooks
export { setSessionToken as setAuthTokens, clearSessionToken as clearAuthTokens, getSessionToken as getAccessToken };

// ============================================
// Types (camelCase, matching Convex returns)
// ============================================

export interface DashboardStats {
  users: {
    total: number;
    newThisMonth: number;
    withProjects: number;
  };
  projects: {
    total: number;
    active: number;
    pending: number;
    rejected: number;
    newThisMonth: number;
  };
  participations: {
    total: number;
    pending: number;
    accepted: number;
    refused: number;
  };
  reviews: {
    total: number;
    averageRating: number;
  };
  reports: {
    total: number;
    pending: number;
  };
  messages: { total: number };
  favorites: { total: number };
}

export interface PendingProject {
  _id: string;
  title: string;
  owner: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string | null;
  } | null;
  _creationTime: number;
  address?: {
    city?: string;
    country?: { name: string; code: string } | null;
  } | null;
  images: Array<{
    _id: string;
    storageId?: string;
    url?: string | null;
    order: number;
  }>;
  missionsCount?: number;
  publishedMissionsCount?: number;
}

export interface ProjectDetail extends PendingProject {
  status: string;
  internetProvided: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  familyFriendly: boolean;
  accommodationDetails?: string;
  foodDetails?: string;
  validatedAt?: number;
}

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string; // "new" | "read" | "resolved"
  _creationTime: number;
}

export interface Report {
  _id: string;
  reporterId: string;
  reporterEmail?: string;
  reporterName: string;
  targetType: string;
  targetId: string;
  reason: string;
  details?: string;
  status: string;
  _creationTime: number;
}

export interface AdminUserDetail {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  bio?: string;
  profilePictureUrl?: string | null;
  emailVerified: boolean;
  isStaff: boolean;
  isSuperuser: boolean;
  isActive: boolean;
  emailNotifications: boolean;
  newsletter: boolean;
  inAppNotifications: boolean;
  notificationLanguage?: string;
  averageRating?: number;
  reviewCount?: number;
  _creationTime: number;
  lastLoginAt?: number;
  address?: {
    city?: string;
    country?: { code: string; name: string } | null;
  } | null;
  languages: Array<{ code: string; name: string }>;
  skills: Array<{ code: string; displayNameEn: string; category: string }>;
  projects: Array<{ _id: string; title: string; status: string; _creationTime: number }>;
  reviewsReceived: Array<{ _id: string; writerId: string; rating: number; feedback: string }>;
}

// ============================================
// Admin API (Convex-based)
// ============================================

export const adminApi = {
  // Dashboard
  async getStats(): Promise<DashboardStats> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    return await convexClient.query(api.admin.dashboard.getStats, { token }) as any;
  },

  // Projects
  async getPendingProjects(): Promise<PendingProject[]> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    return await convexClient.query(api.admin.projects.getPending, { token }) as any;
  },

  async getValidatedProjects(): Promise<PendingProject[]> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    return await convexClient.query(api.admin.projects.getValidated, { token }) as any;
  },

  async validateProject(id: string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.admin.projects.validate, { token, id: id as any });
  },

  async invalidateProject(id: string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.admin.projects.invalidate, { token, id: id as any });
  },

  async rejectProject(id: string, reason: string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.admin.projects.reject, { token, id: id as any, reason });
  },

  async getProjectDetail(id: string): Promise<ProjectDetail> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    return await convexClient.query(api.admin.projects.getDetail, { token, id: id as any }) as any;
  },

  // Reports
  async getReports(status?: string): Promise<Report[]> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    return await convexClient.query(api.admin.reports.list, { token, status }) as any;
  },

  async getPendingReports(): Promise<Report[]> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    return await convexClient.query(api.admin.reports.getPending, { token }) as any;
  },

  async resolveReport(id: string, status: 'RESOLVED' | 'DISMISSED', notes?: string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.admin.reports.resolve, { token, id: id as any, status, notes });
  },

  // Users
  async getUsers(search?: string, emailVerified?: boolean) {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    return await convexClient.query(api.admin.users.list, { token, search, emailVerified }) as any;
  },

  async getUserDetail(id: string): Promise<AdminUserDetail> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    return await convexClient.query(api.admin.users.getDetail, { token, id: id as any }) as any;
  },

  async blockUser(id: string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.admin.users.block, { token, id: id as any });
  },

  async unblockUser(id: string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.admin.users.unblock, { token, id: id as any });
  },

  async deleteUser(id: string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.admin.users.remove, { token, id: id as any });
  },

  async verifyUserEmail(id: string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.admin.users.verifyEmail, { token, id: id as any });
  },

  async unverifyUserEmail(id: string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.admin.users.unverifyEmail, { token, id: id as any });
  },

  // Contact messages
  async getContactMessages(status?: string): Promise<ContactMessage[]> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    return await convexClient.query(api.admin.contacts.list, { token, status }) as any;
  },

  async getUnreadContactCount(): Promise<number> {
    const token = getSessionToken();
    if (!token) return 0;
    try {
      return await convexClient.query(api.admin.contacts.unreadCount, { token }) as number;
    } catch {
      return 0;
    }
  },

  async markContactAsRead(id: string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.admin.contacts.markAsRead, { token, id: id as any });
  },

  async markContactAsResolved(id: string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.admin.contacts.markAsResolved, { token, id: id as any });
  },

  // Auth
  async login(email: string, password: string): Promise<{ token: string }> {
    const result = await convexClient.mutation(api.auth.adminLogin, { email, password });
    const token = (result as any).token;
    setSessionToken(token);
    return { token };
  },

  async getCurrentUser(): Promise<unknown> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    return await convexClient.query(api.auth.me, { token });
  },
};

export default convexClient;
