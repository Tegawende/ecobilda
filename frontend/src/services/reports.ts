import { convexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";

export interface CreateReportData {
  contentType: 'project' | 'review' | 'user';
  objectId: number | string;
  reason: string;
  details?: string;
}

export const reportsService = {
  async createReport(data: CreateReportData): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.reports.create, {
      token,
      targetType: data.contentType.toUpperCase(),
      targetId: String(data.objectId),
      reason: data.reason,
      details: data.details,
    });
  },
};
