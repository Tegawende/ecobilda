import api from './api';
import type { Notification } from '../types';

export const notificationsService = {
  // Get all notifications for current user
  async getNotifications(unreadOnly = false, type?: string): Promise<Notification[]> {
    const params: Record<string, string> = {};
    if (unreadOnly) params.unread_only = 'true';
    if (type) params.type = type;

    const response = await api.get('/notifications/', { params });
    return response.data.results || response.data;
  },

  // Get unread notifications count
  async getUnreadCount(): Promise<number> {
    const response = await api.get('/notifications/unread-count/');
    return response.data.count;
  },

  // Mark notification as read
  async markAsRead(notificationId: number): Promise<Notification> {
    const response = await api.post(`/notifications/${notificationId}/mark-as-read/`);
    return response.data;
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<{ updated_count: number }> {
    const response = await api.post('/notifications/mark-all-read/');
    return response.data;
  },
};
