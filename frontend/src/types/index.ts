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
  notificationLanguage?: 'en' | 'fr' | 'es' | 'de' | 'nl' | 'pt';
  averageRating: number;
  reviewCount: number;
  hasPassword?: boolean;
  isStaff?: boolean;
  isActive?: boolean;
  publicId?: string;
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

// ============================================
// Project (= host's PLACE / lieu d'accueil)
// Lightweight container — descriptive fields about the location.
// ============================================

export interface Project {
  _id: string;
  owner?: User | null;
  ownerId?: string;
  title: string; // place name
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  rejectionReason?: string;
  address?: Address | null;
  addressId?: string;
  accommodationDetails?: string;
  foodDetails?: string;
  internetProvided: boolean;
  familyFriendly: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  languages?: Language[];
  isActive: boolean;
  flaggedCount: number;
  missionsCount?: number;
  publishedMissionsCount?: number;
  _creationTime?: number;
  updatedAt?: number;
  validatedAt?: number | null;
  images?: ProjectImage[];
}

export interface ProjectImage {
  _id: string;
  projectId: string;
  storageId?: string;
  order: number;
  url?: string | null;
}

// ============================================
// Mission (= bookable work unit)
// ============================================

export type MissionType = 'CHANTIER' | 'FORMATION';
export type MissionStatus = 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type MissionDifficulty = 'DEBUTANT' | 'INTERMEDIAIRE' | 'EXPERT';
export type MissionPricingMode = 'FREE' | 'PAID';
export type FeedbackResult = 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILURE';

export interface Mission {
  _id: string;
  projectId: string;
  ownerId: string;
  type: MissionType;
  title: string;
  description: string;
  poste?: string;
  technique?: string;
  difficulty: MissionDifficulty;
  pricingMode: MissionPricingMode;
  priceEUR?: number;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  hoursPerDay: number;
  daysPerWeek: number;
  skillIds?: string[];
  skills?: Skill[];
  coverImageId?: string;
  coverImageUrl?: string | null;
  status: MissionStatus;
  cancellationReason?: string;
  feedbackNotifiedAt?: number;
  feedbackReminderSentAt?: number;
  feedbackDeadlineAt?: number;
  // Joined relations
  project?: {
    _id: string;
    title: string;
    ownerId?: string;
    status?: string;
    accommodationDetails?: string;
    foodDetails?: string;
    internetProvided?: boolean;
    familyFriendly?: boolean;
    petsAllowed?: boolean;
    smokingAllowed?: boolean;
    languages?: Language[];
    address?: Address | null;
  } | null;
  owner?: User | null;
  images?: MissionImage[];
  feedback?: MissionFeedback | null;
  participantsCount?: number;
  _creationTime?: number;
  updatedAt?: number;
}

export interface MissionImage {
  _id: string;
  missionId: string;
  storageId?: string;
  url?: string | null;
  order: number;
}

export interface MissionFeedback {
  _id: string;
  missionId: string;
  totalCostEUR?: number;
  surfaceM2?: number;
  actualDurationDays?: number;
  result?: FeedbackResult;
  difficultiesText?: string;
  learningsText?: string;
  photoIds?: string[];
  photoUrls?: string[];
  isPublic: boolean;
  submittedAt: number;
}

export interface HelperMissionPhoto {
  _id: string;
  missionId: string;
  helperId: string;
  storageId: string;
  url?: string | null;
  isPublic: boolean;
  caption?: string;
  helper?: { _id: string; firstName: string; lastName: string } | null;
  _creationTime?: number;
}

// Map marker payload (lightweight)
export interface MissionMapPoint {
  _id: string;
  title: string;
  type: MissionType;
  difficulty: MissionDifficulty;
  poste?: string;
  startDate: string;
  endDate: string;
  pricingMode: MissionPricingMode;
  priceEUR?: number;
  latitude: number;
  longitude: number;
  city?: string;
}

// ============================================
// Messaging types
// ============================================

export interface Conversation {
  _id: string;
  user1Id?: string;
  user2Id?: string;
  otherUser?: {
    _id: string;
    publicId?: string;
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
  user1LastReadAt?: number;
  user2LastReadAt?: number;
  participationDetails?: {
    _id: string;
    proposedStartDate?: string | null;
    proposedEndDate?: string | null;
    status: string;
    mission?: {
      _id: string;
      title: string;
      coverImageUrl?: string | null;
    } | null;
  } | null;
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
  isSystem?: boolean;
  imageStorageId?: string;
  imageUrl?: string | null;
  _creationTime?: number;
}

// ============================================
// Review types
// ============================================

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

// ============================================
// Notification types
// ============================================

export interface Notification {
  _id: string;
  recipientId: string;
  type: 'REVIEW' | 'MESSAGE' | 'ADMIN' | 'PROJECT' | 'MISSION' | 'SYSTEM';
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  readAt?: number | null;
  _creationTime?: number;
}

// ============================================
// Participation types (now mission-based)
// ============================================

export interface ParticipationRequest {
  _id: string;
  volunteerId: string;
  missionId: string;
  mission?: {
    _id: string;
    title: string;
    type: MissionType;
    poste?: string;
    technique?: string;
    difficulty: MissionDifficulty;
    startDate: string;
    endDate: string;
    maxParticipants?: number;
    status: MissionStatus;
    coverImageUrl?: string | null;
  } | null;
  project?: {
    _id: string;
    title: string;
    ownerId?: string;
    address?: Address | null;
  } | null;
  host?: User | null;
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

// ============================================
// Auth types
// ============================================

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
