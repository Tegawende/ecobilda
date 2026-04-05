"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getSessionToken } from "@/lib/convexClient";
import type { Skill, Language } from "@/types";

// ============================================
// Skills
// ============================================

export function useSkills(category?: "PERM" | "NATB") {
  const skills = useQuery(api.skills.list, { category });

  const mapped: Skill[] | undefined = skills?.map((s) => ({
    code: s.code,
    category: s.category as "PERM" | "NATB",
    display_name_en: s.displayNameEn,
    display_name_fr: s.displayNameFr,
    display_name_es: s.displayNameEs,
    display_name_de: s.displayNameDe,
    display_name_nl: s.displayNameNl ?? "",
    display_name_pt: s.displayNamePt ?? "",
    icon: s.icon ?? "",
  }));

  return {
    skills: mapped ?? [],
    isLoading: skills === undefined,
  };
}

// ============================================
// Languages
// ============================================

export function useLanguages() {
  const languages = useQuery(api.languages.list);

  const mapped: Language[] | undefined = languages?.map((l) => ({
    code: l.code,
    name: l.name,
  }));

  return {
    languages: mapped ?? [],
    isLoading: languages === undefined,
  };
}

// ============================================
// Current User
// ============================================

export function useCurrentUser() {
  const token = getSessionToken();
  const user = useQuery(api.auth.me, { token: token ?? undefined });

  return {
    user: user ?? null,
    isLoading: user === undefined,
    isAuthenticated: !!user,
  };
}

// ============================================
// Notifications (reactive)
// ============================================

export function useNotifications(unreadOnly?: boolean) {
  const token = getSessionToken();
  const notifications = useQuery(
    api.notifications.listForUser,
    token ? { token, unreadOnly } : "skip"
  );

  return {
    notifications: notifications ?? [],
    isLoading: notifications === undefined,
  };
}

export function useUnreadCount() {
  const token = getSessionToken();
  const count = useQuery(
    api.notifications.getUnreadCount,
    token ? { token } : "skip"
  );

  return count ?? 0;
}

// ============================================
// Conversations (reactive - replaces WebSocket)
// ============================================

export function useConversations() {
  const token = getSessionToken();
  const conversations = useQuery(
    api.conversations.listForUser,
    token ? { token } : "skip"
  );

  return {
    conversations: conversations ?? [],
    isLoading: conversations === undefined,
  };
}

export function useMessages(conversationId: string | null) {
  const token = getSessionToken();
  const messages = useQuery(
    api.messages.getByConversation,
    token && conversationId
      ? { token, conversationId: conversationId as any }
      : "skip"
  );

  return {
    messages: messages ?? [],
    isLoading: messages === undefined,
  };
}

// ============================================
// Projects
// ============================================

export function useProjects(filters?: {
  keyword?: string;
  skills?: string[];
  countries?: string[];
  projectType?: string;
  internetProvided?: boolean;
  familyFriendly?: boolean;
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
}) {
  const projects = useQuery(api.projects.list, filters ?? {});

  return {
    projects: projects ?? [],
    isLoading: projects === undefined,
  };
}

export function useProject(id: string | null) {
  const project = useQuery(
    api.projects.getById,
    id ? { id: id as any } : "skip"
  );

  return {
    project: project ?? null,
    isLoading: project === undefined,
  };
}

export function useMyProjects() {
  const token = getSessionToken();
  const projects = useQuery(
    api.projects.getMyProjects,
    token ? { token } : "skip"
  );

  return {
    projects: projects ?? [],
    isLoading: projects === undefined,
  };
}

export function useMapData() {
  const mapData = useQuery(api.projects.getMapData);

  return {
    mapData: mapData ?? [],
    isLoading: mapData === undefined,
  };
}

// ============================================
// Reviews
// ============================================

export function useUserReviews(userId: string | null) {
  const reviews = useQuery(
    api.reviews.getByUser,
    userId ? { userId: userId as any } : "skip"
  );

  return {
    reviews: reviews ?? [],
    isLoading: reviews === undefined,
  };
}

// ============================================
// Favorites
// ============================================

export function useFavorites() {
  const token = getSessionToken();
  const user = useQuery(api.auth.me, { token: token ?? undefined });
  const favorites = useQuery(
    api.favorites.getMyFavorites,
    user?._id ? { userId: user._id } : "skip"
  );

  return {
    favoriteProjectIds: favorites ?? [],
    isLoading: favorites === undefined,
  };
}

// ============================================
// Participations
// ============================================

export function useMyParticipations() {
  const token = getSessionToken();
  const requests = useQuery(
    api.participations.getMyRequests,
    token ? { token } : "skip"
  );

  return {
    requests: requests ?? [],
    isLoading: requests === undefined,
  };
}

export function useReceivedParticipations() {
  const token = getSessionToken();
  const requests = useQuery(
    api.participations.getReceivedRequests,
    token ? { token } : "skip"
  );

  return {
    requests: requests ?? [],
    isLoading: requests === undefined,
  };
}
