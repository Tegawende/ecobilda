/**
 * Mock Service Layer for Ecobilda Frontend
 * Returns mock data for development without backend
 */

import {
    mockUser,
    mockUserProjects,
    mockFavoriteProjects,
    mockParticipations,
    mockReviews,
    mockConversations,
    mockMessages,
    mockNotifications,
    mockAllProjects,
    type Participation,
} from '../data/mockData';
import type { User, Project, Review, Conversation, Message, Notification, PaginatedResponse } from '../types';
import logger from '../utils/logger';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============== AUTH MOCK ==============
export const mockAuthService = {
    isMockUser(email: string): boolean {
        return email.toLowerCase() === 'test@test.be';
    },

    async mockLogin(): Promise<{ tokens: { access: string; refresh: string }; user: User }> {
        await delay(500);
        return {
            tokens: { access: 'mock_access_token_ecobilda', refresh: 'mock_refresh_token_ecobilda' },
            user: mockUser,
        };
    },

    getMockUser(): User {
        return mockUser;
    },
};

// ============== PROFILE MOCK ==============
export const mockProfileService = {
    async getProfile(): Promise<User> {
        await delay(300);
        return mockUser;
    },

    async updateProfile(data: Partial<User>): Promise<User> {
        await delay(400);
        return { ...mockUser, ...data };
    },
};

// ============== PROJECTS MOCK ==============
export const mockProjectsService = {
    async getProjects(params?: { my_projects?: boolean }): Promise<PaginatedResponse<Project>> {
        await delay(400);
        const projects = params?.my_projects ? mockUserProjects : mockAllProjects;
        return {
            count: projects.length,
            next: null,
            previous: null,
            results: projects,
        };
    },

    async getProject(id: number): Promise<Project | null> {
        await delay(300);
        return mockAllProjects.find(p => p.id === id) || null;
    },

    async getUserProjects(): Promise<Project[]> {
        await delay(300);
        return mockUserProjects;
    },
};

// ============== FAVORITES MOCK ==============
export const mockFavoritesService = {
    async getFavorites(): Promise<number[]> {
        await delay(200);
        return mockFavoriteProjects.map(p => p.id);
    },

    async getFavoriteProjects(): Promise<Project[]> {
        await delay(400);
        return mockFavoriteProjects;
    },

    async addFavorite(projectId: number): Promise<void> {
        await delay(200);
        logger.debug('Mock: Added favorite', projectId);
    },

    async removeFavorite(projectId: number): Promise<void> {
        await delay(200);
        logger.debug('Mock: Removed favorite', projectId);
    },
};

// ============== PARTICIPATIONS MOCK ==============
export const mockParticipationsService = {
    async getParticipations(): Promise<Participation[]> {
        await delay(400);
        return mockParticipations;
    },

    async getParticipation(id: number): Promise<Participation | null> {
        await delay(300);
        return mockParticipations.find(p => p.id === id) || null;
    },
};

// ============== REVIEWS MOCK ==============
export const mockReviewsService = {
    async getUserReviews(userId: number): Promise<Review[]> {
        await delay(300);
        return mockReviews.filter(r => r.receiver.id === userId);
    },

    async updateReviewResponse(reviewId: number, data: { response: string }): Promise<Review> {
        await delay(400);
        const review = mockReviews.find(r => r.id === reviewId);
        if (review) {
            return {
                ...review,
                response: data.response,
                response_date: new Date().toISOString(),
            };
        }
        throw new Error('Review not found');
    },
};

// ============== MESSAGING MOCK ==============
export const mockMessagingService = {
    async getConversations(): Promise<Conversation[]> {
        await delay(300);
        return mockConversations;
    },

    async getConversation(id: number): Promise<Conversation | null> {
        await delay(200);
        return mockConversations.find(c => c.id === id) || null;
    },

    async getMessages(conversationId: number): Promise<Message[]> {
        await delay(300);
        return mockMessages.filter(m => m.conversation === conversationId);
    },

    async sendMessage(conversationId: number, body: string): Promise<Message> {
        await delay(400);
        return {
            id: Date.now(),
            conversation: conversationId,
            sender: mockUser,
            body,
            created_at: new Date().toISOString(),
        };
    },

    async toggleMute(conversationId: number): Promise<void> {
        await delay(200);
        logger.debug('Mock: Toggled mute for conversation', conversationId);
    },

    async deleteConversation(conversationId: number): Promise<void> {
        await delay(300);
        logger.debug('Mock: Deleted conversation', conversationId);
    },
};

// ============== NOTIFICATIONS MOCK ==============
export const mockNotificationsService = {
    async getNotifications(): Promise<Notification[]> {
        await delay(300);
        return mockNotifications;
    },

    async markAsRead(id: number): Promise<void> {
        await delay(200);
        logger.debug('Mock: Marked notification as read', id);
    },

    async markAllAsRead(): Promise<void> {
        await delay(300);
        logger.debug('Mock: Marked all notifications as read');
    },

    getUnreadCount(): number {
        return mockNotifications.filter(n => !n.is_read).length;
    },
};

// ============== CHECK IF USING MOCK MODE ==============
export const isMockMode = (): boolean => {
    const tokens = localStorage.getItem('auth_tokens');
    if (tokens) {
        try {
            const parsed = JSON.parse(tokens);
            return parsed.access === 'mock_access_token_ecobilda';
        } catch {
            return false;
        }
    }
    return false;
};
