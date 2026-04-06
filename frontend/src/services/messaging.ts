import { convexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";
import type { Conversation, Message } from '../types';

export interface SendMessageData {
  body: string;
  imageStorageId?: string;
}

export interface CreateConversationData {
  recipient_id: number | string;
  initial_message?: string;
}

export const messagingService = {
  async getOrCreateConversation(recipientId: number | string): Promise<Conversation> {
    // Find existing conversation with this user
    const conversations = await this.getConversations();
    const existing = conversations.find(
      (c: any) => c.otherUser?._id === recipientId || c.user1Id === recipientId || c.user2Id === recipientId
    );
    if (existing) return existing as any;
    // No existing conversation found - this shouldn't happen in the Convex model
    // Conversations are created when participations are accepted
    throw new Error("No conversation found with this user.");
  },

  async getConversations(): Promise<Conversation[]> {
    const token = getSessionToken();
    if (!token) return [];
    const results = await convexClient.query(api.conversations.listForUser, { token });
    return results as any;
  },

  async getConversation(conversationId: number | string): Promise<Conversation> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    const result = await convexClient.query(api.conversations.getById, {
      token,
      id: conversationId as any,
    });
    if (!result) throw new Error("Conversation not found");
    return result as any;
  },

  async getMessages(conversationId: number | string): Promise<Message[]> {
    const token = getSessionToken();
    if (!token) return [];
    const results = await convexClient.query(api.messages.getByConversation, {
      token,
      conversationId: conversationId as any,
    });
    return results as any;
  },

  async sendMessage(conversationId: number | string, data: SendMessageData): Promise<Message> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    const messageId = await convexClient.mutation(api.messages.send, {
      token,
      conversationId: conversationId as any,
      body: data.body,
      ...(data.imageStorageId ? { imageStorageId: data.imageStorageId as any } : {}),
    });
    return { id: messageId } as any;
  },

  async markAsRead(conversationId: number | string): Promise<void> {
    const token = getSessionToken();
    if (!token) return;
    await convexClient.mutation(api.conversations.markAsRead, {
      token,
      id: conversationId as any,
    });
  },

  async toggleMute(conversationId: number | string): Promise<Conversation> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.conversations.toggleMute, {
      token,
      id: conversationId as any,
    });
    return await this.getConversation(conversationId);
  },

  async deleteConversation(conversationId: number | string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.conversations.deleteConversation, {
      token,
      id: conversationId as any,
    });
  },

  async generateMessageUploadUrl(conversationId: number | string): Promise<string> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    return await convexClient.mutation(api.conversations.generateMessageUploadUrl, {
      token,
      conversationId: conversationId as any,
    });
  },
};
