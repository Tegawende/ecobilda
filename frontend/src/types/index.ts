// User types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'M' | 'F' | 'O' | 'P';
  bio: string;
  profile_picture: string | null;
  address: Address;
  languages: Language[];
  skills: Skill[];
  email_notifications: boolean;
  newsletter: boolean;
  in_app_notifications: boolean;
  notification_language: 'en' | 'fr' | 'es' | 'de';
  average_rating: number;
  review_count: number;
}

// Address types
export interface Address {
  id: number;
  city: string;
  street: string;
  street_number: string;
  postal_code: string;
  country: Country;
  latitude: number;
  longitude: number;
  formatted_address: string;
}

export interface Country {
  code: string;
  name: string;
}

export interface Language {
  code: string;
  name: string;
}

// Skill types
export interface Skill {
  code: string;
  category: 'PERM' | 'NATB';
  display_name_en: string;
  display_name_fr: string;
  display_name_es: string;
  display_name_de: string;
  icon: string;
}

// Project types
export interface Project {
  id: number;
  owner: User;
  title: string;
  description: string;
  project_type: 'PERM' | 'NATB';
  address: Address;
  hours_per_day: number;
  days_per_week: number;
  max_helpers: number;
  accommodation_details: string;
  food_details: string;
  internet_provided: boolean;
  family_friendly: boolean;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  is_free: boolean;
  skills: Skill[];
  is_active: boolean;
  flagged_count: number;
  created_at: string;
  updated_at: string;
  images: ProjectImage[];
  availabilities: Availability[];
}

export interface ProjectImage {
  id: number;
  project: number;
  image: string;
  is_cover: boolean;
  order: number;
}

export interface Availability {
  id: number;
  project: number;
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
  id: number;
  user1: User;
  user2: User;
  last_message_text: string;
  last_message_at: string;
  unread_count_user1: number;
  unread_count_user2: number;
  user1_muted: boolean;
  user2_muted: boolean;
}

export interface Message {
  id: number;
  conversation: number;
  sender: User;
  body: string;
  created_at: string;
}

// Review types
export interface Review {
  id: number;
  writer: User;
  receiver: User;
  rating: number;
  feedback: string;
  response: string;
  response_date: string | null;
  created_at: string;
  updated_at: string;
}

// Notification types
export interface Notification {
  id: number;
  recipient: number;
  type: 'REVIEW' | 'MESSAGE' | 'ADMIN' | 'PROJECT' | 'SYSTEM';
  title: string;
  message: string;
  link_url: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender_profile_picture?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

// API Response types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  [key: string]: any;
}
