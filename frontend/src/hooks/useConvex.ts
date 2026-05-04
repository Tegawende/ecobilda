"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getSessionToken } from "@/lib/convexClient";

// ============================================
// Skills
// ============================================

export function useSkills(category?: "PERM" | "NATB") {
  const skills = useQuery(api.skills.list, { category });

  const mapped = skills?.map((s) => ({
    _id: s._id,
    code: s.code,
    category: s.category as "PERM" | "NATB",
    displayNameEn: s.displayNameEn,
    displayNameFr: s.displayNameFr,
    displayNameEs: s.displayNameEs,
    displayNameDe: s.displayNameDe,
    displayNameNl: s.displayNameNl ?? "",
    displayNamePt: s.displayNamePt ?? "",
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

  const mapped = languages?.map((l) => ({
    _id: l._id,
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
// Conversations
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

export function useConversation(conversationId: string | null) {
  const token = getSessionToken();
  const conversation = useQuery(
    api.conversations.getById,
    token && conversationId ? { token, id: conversationId as any } : "skip"
  );

  return {
    conversation: conversation ?? null,
    isLoading: conversation === undefined,
  };
}

// ============================================
// Projects (= host's place container)
// ============================================

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

export function useMyPlaces() {
  const token = getSessionToken();
  const places = useQuery(
    api.projects.getMyPlaces,
    token ? { token } : "skip"
  );

  return {
    places: places ?? [],
    isLoading: places === undefined,
  };
}

// Backwards-compat alias
export const useMyProjects = () => {
  const { places, isLoading } = useMyPlaces();
  return { projects: places, isLoading };
};

// ============================================
// Missions
// ============================================

export interface UseMissionsFilters {
  keyword?: string;
  type?: "CHANTIER" | "FORMATION";
  difficulty?: "DEBUTANT" | "INTERMEDIAIRE" | "EXPERT";
  poste?: string;
  technique?: string;
  pricingMode?: "FREE" | "PAID";
  skills?: string[];
  countries?: string[];
  languages?: string[];
  startsAfter?: string;
  endsBefore?: string;
  excludeOwner?: string;
}

export function useMissions(filters?: UseMissionsFilters) {
  const args: any = {};
  if (filters?.keyword) args.keyword = filters.keyword;
  if (filters?.type) args.type = filters.type;
  if (filters?.difficulty) args.difficulty = filters.difficulty;
  if (filters?.poste) args.poste = filters.poste;
  if (filters?.technique) args.technique = filters.technique;
  if (filters?.pricingMode) args.pricingMode = filters.pricingMode;
  if (filters?.skills?.length) args.skills = filters.skills;
  if (filters?.countries?.length) args.countries = filters.countries;
  if (filters?.languages?.length) args.languages = filters.languages;
  if (filters?.startsAfter) args.startsAfter = filters.startsAfter;
  if (filters?.endsBefore) args.endsBefore = filters.endsBefore;
  if (filters?.excludeOwner) args.excludeOwner = filters.excludeOwner;

  const missions = useQuery(api.missions.list, args);
  return {
    missions: missions ?? [],
    isLoading: missions === undefined,
  };
}

export function useMission(id: string | null) {
  const mission = useQuery(
    api.missions.getById,
    id ? { id: id as any } : "skip"
  );
  return {
    mission: mission ?? null,
    isLoading: mission === undefined,
  };
}

export function useMyMissions() {
  const token = getSessionToken();
  const missions = useQuery(
    api.missions.getMyMissions,
    token ? { token } : "skip"
  );
  return {
    missions: missions ?? [],
    isLoading: missions === undefined,
  };
}

export function useMissionsMapData() {
  const data = useQuery(api.missions.getMapData);
  return {
    mapData: data ?? [],
    isLoading: data === undefined,
  };
}

// Backwards-compat alias for any older imports
export const useMapData = useMissionsMapData;

export function useMissionsByProject(projectId: string | null, excludeId?: string) {
  const args = projectId
    ? excludeId
      ? { projectId: projectId as any, excludeId: excludeId as any }
      : { projectId: projectId as any }
    : "skip";
  const missions = useQuery(api.missions.getByProject, args as any);
  return {
    missions: missions ?? [],
    isLoading: missions === undefined,
  };
}

export function useCompletedMissionsPublic(filters?: {
  poste?: string;
  technique?: string;
  type?: string;
}) {
  const args: any = {};
  if (filters?.poste) args.poste = filters.poste;
  if (filters?.technique) args.technique = filters.technique;
  if (filters?.type) args.type = filters.type;
  const missions = useQuery(api.missions.getCompletedPublic, args);
  return {
    missions: missions ?? [],
    isLoading: missions === undefined,
  };
}

export function useMissionFeedback(missionId: string | null) {
  const feedback = useQuery(
    api.missionFeedback.getByMissionId,
    missionId ? { missionId: missionId as any } : "skip"
  );
  return {
    feedback: feedback ?? null,
    isLoading: feedback === undefined,
  };
}

export function useHelperMissionPhotos(missionId: string | null, publicOnly = false) {
  const photos = useQuery(
    api.missionFeedback.getHelperPhotos,
    missionId ? { missionId: missionId as any, publicOnly } : "skip"
  );
  return {
    photos: photos ?? [],
    isLoading: photos === undefined,
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
// Favorites (now mission-based)
// ============================================

export function useFavorites() {
  const token = getSessionToken();
  const user = useQuery(api.auth.me, { token: token ?? undefined });
  const favorites = useQuery(
    api.favorites.getMyFavorites,
    user?._id ? { userId: user._id } : "skip"
  );

  return {
    favoriteMissionIds: favorites ?? [],
    // Backwards-compat alias
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
