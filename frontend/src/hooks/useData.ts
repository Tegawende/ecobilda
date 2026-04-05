'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService, type ProjectFilters } from '../services/projects';
import { profileService } from '../services/profile';
import { favoritesService } from '../services/favorites';
import { messagingService } from '../services/messaging';
import { notificationsService } from '../services/notifications';
import type { Project, User, Conversation, Notification } from '../types';

/**
 * Hook for fetching the current user profile
 */
export function useCurrentUser() {
  return useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: () => profileService.getProfile(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching all projects with optional filters
 */
export function useProjects(filters?: ProjectFilters) {
  return useQuery<Project[]>({
    queryKey: ['projects', filters],
    queryFn: async () => {
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
      const response = await projectsService.getProjects({ excludeOwn: false });
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
    queryFn: () => favoritesService.getFavorites(),
  });
}

/**
 * Hook for toggling favorite status
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, isFavorite }: { projectId: number; isFavorite: boolean }) => {
      if (isFavorite) {
        return favoritesService.removeFavorite(projectId);
      }
      return favoritesService.addFavorite(projectId);
    },
    onSuccess: () => {
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
    queryFn: () => messagingService.getConversations(),
  });
}

/**
 * Hook for fetching notifications
 */
export function useNotifications(unreadOnly = false) {
  return useQuery<Notification[]>({
    queryKey: ['notifications', unreadOnly],
    queryFn: () => notificationsService.getNotifications(unreadOnly),
  });
}

/**
 * Hook for getting unread notification count
 */
export function useUnreadNotificationCount() {
  return useQuery<number>({
    queryKey: ['unreadNotificationCount'],
    queryFn: () => notificationsService.getUnreadCount(),
    refetchInterval: 30000,
  });
}
