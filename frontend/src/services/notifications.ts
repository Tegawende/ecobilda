import { convexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";
import type { Notification } from '../types';

export const notificationsService = {
  async getNotifications(unreadOnly = false, type?: string): Promise<Notification[]> {
    const token = getSessionToken();
    if (!token) return [];
    const results = await convexClient.query(api.notifications.listForUser, {
      token,
      unreadOnly,
      type,
    });
    return results as any;
  },

  async getUnreadCount(): Promise<number> {
    const token = getSessionToken();
    if (!token) return 0;
    return await convexClient.query(api.notifications.getUnreadCount, { token });
  },

  async markAsRead(notificationId: number | string): Promise<Notification> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.notifications.markAsRead, {
      token,
      id: notificationId as any,
    });
    return { id: notificationId } as any;
  },

  async markAllAsRead(): Promise<{ updated_count: number }> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    const result = await convexClient.mutation(api.notifications.markAllAsRead, { token });
    return { updated_count: result.count };
  },
};
