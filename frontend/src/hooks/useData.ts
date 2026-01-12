/**
 * Custom hooks for data fetching with mock/API abstraction
 * 
 * These hooks automatically switch between mock data and real API calls
 * based on the VITE_USE_MOCK environment variable.
 * 
 * Set VITE_USE_MOCK=true in .env to use mock data
 * Set VITE_USE_MOCK=false or remove it to use real API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService, type ProjectFilters } from '../services/projects';
import { profileService } from '../services/profile';
import { favoritesService } from '../services/favorites';
import { messagingService } from '../services/messaging';
import { notificationsService } from '../services/notifications';
import {
    mockUser,
    mockAllProjects,
    mockUserProjects,
    mockFavoriteProjects,
    mockConversations,
    mockNotifications,
} from '../data/mockData';
import type { Project, User, Conversation, Notification } from '../types';

// Check if we should use mock data
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/**
 * Hook for fetching the current user profile
 */
export function useCurrentUser() {
    return useQuery<User>({
        queryKey: ['currentUser'],
        queryFn: async () => {
            if (USE_MOCK) {
                // Simulate network delay
                await new Promise((resolve) => setTimeout(resolve, 300));
                return mockUser;
            }
            return profileService.getProfile();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook for fetching all projects with optional filters
 */
export function useProjects(filters?: ProjectFilters) {
    return useQuery<Project[]>({
        queryKey: ['projects', filters],
        queryFn: async () => {
            if (USE_MOCK) {
                await new Promise((resolve) => setTimeout(resolve, 300));
                let projects = [...mockAllProjects];

                if (filters?.project_type) {
                    projects = projects.filter((p) => p.project_type === filters.project_type);
                }

                if (filters?.keyword) {
                    const search = filters.keyword.toLowerCase();
                    projects = projects.filter(
                        (p) =>
                            p.title.toLowerCase().includes(search) ||
                            p.description.toLowerCase().includes(search) ||
                            p.address?.city?.toLowerCase().includes(search)
                    );
                }

                return projects;
            }
            // Real API returns paginated response, extract results
            const response = await projectsService.getProjects(filters);
            return response.results;
        },
    });
}

/**
 * Hook for fetching a single project by ID
 */
export function useProject(id: number | string | undefined) {
    return useQuery<Project | null>({
        queryKey: ['project', id],
        queryFn: async () => {
            if (!id) return null;

            if (USE_MOCK) {
                await new Promise((resolve) => setTimeout(resolve, 200));
                const project = mockAllProjects.find((p) => p.id === Number(id));
                return project || null;
            }
            return projectsService.getProject(Number(id));
        },
        enabled: !!id,
    });
}

/**
 * Hook for fetching user's own projects
 */
export function useMyProjects() {
    return useQuery<Project[]>({
        queryKey: ['myProjects'],
        queryFn: async () => {
            if (USE_MOCK) {
                await new Promise((resolve) => setTimeout(resolve, 300));
                return mockUserProjects;
            }
            // For real API, we'd filter by current user - for now return paginated results
            const response = await projectsService.getProjects({ exclude_own: false });
            return response.results;
        },
    });
}

/**
 * Hook for fetching user's favorites (returns project IDs)
 */
export function useFavorites() {
    return useQuery<number[]>({
        queryKey: ['favorites'],
        queryFn: async () => {
            if (USE_MOCK) {
                await new Promise((resolve) => setTimeout(resolve, 300));
                // Return project IDs from mock favorites
                return mockFavoriteProjects.map(p => p.id);
            }
            return favoritesService.getFavorites();
        },
    });
}

/**
 * Hook for toggling favorite status
 */
export function useToggleFavorite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ projectId, isFavorite }: { projectId: number; isFavorite: boolean }) => {
            if (USE_MOCK) {
                await new Promise((resolve) => setTimeout(resolve, 200));
                return { success: true };
            }

            if (isFavorite) {
                return favoritesService.removeFavorite(projectId);
            }
            return favoritesService.addFavorite(projectId);
        },
        onSuccess: () => {
            // Invalidate favorites query to refetch
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
    });
}

/**
 * Hook for fetching conversations
 */
export function useConversations() {
    return useQuery<Conversation[]>({
        queryKey: ['conversations'],
        queryFn: async () => {
            if (USE_MOCK) {
                await new Promise((resolve) => setTimeout(resolve, 300));
                return mockConversations;
            }
            return messagingService.getConversations();
        },
    });
}

/**
 * Hook for fetching notifications
 */
export function useNotifications(unreadOnly = false) {
    return useQuery<Notification[]>({
        queryKey: ['notifications', unreadOnly],
        queryFn: async () => {
            if (USE_MOCK) {
                await new Promise((resolve) => setTimeout(resolve, 200));
                const notifications = unreadOnly
                    ? mockNotifications.filter((n) => !n.is_read)
                    : mockNotifications;
                return notifications;
            }
            return notificationsService.getNotifications(unreadOnly);
        },
    });
}

/**
 * Hook for getting unread notification count
 */
export function useUnreadNotificationCount() {
    return useQuery<number>({
        queryKey: ['unreadNotificationCount'],
        queryFn: async () => {
            if (USE_MOCK) {
                await new Promise((resolve) => setTimeout(resolve, 100));
                return mockNotifications.filter((n) => !n.is_read).length;
            }
            return notificationsService.getUnreadCount();
        },
        refetchInterval: 30000, // Refetch every 30 seconds
    });
}
