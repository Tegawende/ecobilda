// User types
export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: 'M' | 'F' | 'O' | 'P';
  bio?: string;
  profilePicture?: string | null;
  profilePictureUrl?: string | null;
  address?: Address | null;
  languages?: Language[];
  skills?: Skill[];
  emailNotifications?: boolean;
  newsletter?: boolean;
  inAppNotifications?: boolean;
  notificationLanguage?: 'en' | 'fr' | 'es' | 'de';
  averageRating: number;
  reviewCount: number;
  isStaff?: boolean;
  isActive?: boolean;
  _creationTime?: number;
  lastLoginAt?: number;
}

// Address types
export interface Address {
  _id?: string;
  city?: string;
  street?: string;
  streetNumber?: string;
  postalCode?: string;
  country?: Country | null;
  countryId?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
}

export interface Country {
  _id?: string;
  code: string;
  name: string;
}

export interface Language {
  _id?: string;
  code: string;
  name: string;
}

// Skill types
export interface Skill {
  _id?: string;
  code: string;
  category: 'PERM' | 'NATB';
  displayNameEn: string;
  displayNameFr: string;
  displayNameEs: string;
  displayNameDe: string;
  displayNameNl?: string;
  displayNamePt?: string;
  icon?: string;
}

// Project types
export interface Project {
  _id: string;
  owner?: User | null;
  ownerId?: string;
  title: string;
  description: string;
  projectType: 'PERM' | 'NATB';
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  address?: Address | null;
  addressId?: string;
  hoursPerDay: number;
  daysPerWeek: number;
  maxHelpers: number;
  accommodationDetails?: string;
  foodDetails?: string;
  internetProvided: boolean;
  familyFriendly: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  skills?: Skill[];
  skillIds?: string[];
  isActive: boolean;
  flaggedCount: number;
  _creationTime?: number;
  updatedAt?: number;
  validatedAt?: number | null;
  images?: ProjectImage[];
  availabilities?: Availability[];
}

export interface ProjectImage {
  _id: string;
  projectId: string;
  storageId: string;
  order: number;
  url?: string; // Resolved URL from Convex storage
}

export interface Availability {
  _id?: string;
  projectId: string;
  year: number;
  january: boolean;
  february: boolean;
  march: boolean;
  april: boolean;
  may: boolean;
  june: boolean;
  july: boolean;
  august: boolean;
  september: boolean;
  october: boolean;
  november: boolean;
  december: boolean;
}

// Messaging types
export interface Conversation {
  _id: string;
  user1Id?: string;
  user2Id?: string;
  otherUser?: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string | null;
    profilePictureUrl?: string | null;
  } | null;
  participationRequestId?: string;
  lastMessageText?: string;
  lastMessageAt?: number;
  unreadCount?: number;
  isMuted?: boolean;
  _creationTime?: number;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender?: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string | null;
    profilePictureUrl?: string | null;
  } | null;
  senderId?: string;
  body: string;
  _creationTime?: number;
}

// Review types
export interface Review {
  _id: string;
  writer?: User | null;
  writerId?: string;
  receiver?: User | null;
  receiverId?: string;
  rating: number;
  feedback: string;
  response?: string;
  responseDate?: number | null;
  isPublished?: boolean;
  _creationTime?: number;
  updatedAt?: number;
}

// Notification types
export interface Notification {
  _id: string;
  recipientId: string;
  type: 'REVIEW' | 'MESSAGE' | 'ADMIN' | 'PROJECT' | 'SYSTEM';
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  readAt?: number | null;
  _creationTime?: number;
}

// Participation types
export interface ParticipationRequest {
  _id: string;
  volunteerId: string;
  projectId: string;
  project?: {
    _id: string;
    title: string;
    projectType: string;
    address?: Address | null;
    ownerId?: string;
  } | null;
  volunteer?: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string | null;
    profilePictureUrl?: string | null;
    averageRating?: number;
    reviewCount?: number;
  } | null;
  status: 'PENDING' | 'ACCEPTED' | 'REFUSED' | 'CANCELLED' | 'EXPIRED';
  motivation: string;
  proposedStartDate?: string;
  proposedEndDate?: string;
  hostResponseMessage?: string;
  respondedAt?: number;
  _creationTime?: number;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  passwordConfirm: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  locale?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

// Helper: get skill display name for current locale
export function getSkillDisplayName(skill: Skill, locale: string): string {
  const key = `displayName${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof Skill;
  return (skill[key] as string) || skill.displayNameEn;
}
