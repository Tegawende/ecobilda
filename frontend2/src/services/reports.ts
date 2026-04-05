import { convexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";

export interface CreateReportData {
  content_type: 'project' | 'review' | 'user';
  object_id: number | string;
  reason: string;
  details?: string;
}

export const reportsService = {
  async createReport(data: CreateReportData): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.reports.create, {
      token,
      targetType: data.content_type.toUpperCase(),
      targetId: String(data.object_id),
      reason: data.reason,
      details: data.details,
    });
  },
};
