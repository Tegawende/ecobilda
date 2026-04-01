import api from './api';
import type { Conversation, Message } from '../types';

export interface CreateConversationData {
  recipient_id: number;
  initial_message?: string;
}

export interface SendMessageData {
  body: string;
}

export const messagingService = {
  // Get all conversations for current user
  async getConversations(): Promise<Conversation[]> {
    const response = await api.get('/conversations/');
    return response.data.results || response.data;
  },

  // Get or create conversation with a specific user
  async getOrCreateConversation(recipientId: number): Promise<Conversation> {
    const response = await api.post('/conversations/', {
      recipient_id: recipientId,
    });
    return response.data;
  },

  // Get conversation by ID
  async getConversation(conversationId: number): Promise<Conversation> {
    const response = await api.get(`/conversations/${conversationId}/`);
    return response.data;
  },

  // Get messages for a conversation
  async getMessages(conversationId: number): Promise<Message[]> {
    const response = await api.get(`/conversations/${conversationId}/messages/`);
    return response.data.results || response.data;
  },

  // Send a message in a conversation
  async sendMessage(conversationId: number, data: SendMessageData): Promise<Message> {
    const response = await api.post(`/conversations/${conversationId}/send-message/`, data);
    return response.data;
  },

  // Mark conversation as read
  async markAsRead(conversationId: number): Promise<void> {
    await api.post(`/conversations/${conversationId}/mark-as-read/`);
  },

  // Mute/unmute conversation
  async toggleMute(conversationId: number): Promise<Conversation> {
    const response = await api.post(`/conversations/${conversationId}/toggle-mute/`);
    return response.data;
  },

  // Delete conversation
  async deleteConversation(conversationId: number): Promise<void> {
    await api.delete(`/conversations/${conversationId}/`);
  },
};
