import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // Reference Data
  // ============================================

  countries: defineTable({
    code: v.string(), // ISO 3166-1 alpha-2 (e.g. "FR", "BE")
    name: v.string(),
  }).index("by_code", ["code"]),

  languages: defineTable({
    code: v.string(), // ISO 639-1 (e.g. "en", "fr")
    name: v.string(),
  }).index("by_code", ["code"]),

  skills: defineTable({
    code: v.string(), // e.g. "carpentry", "composting"
    category: v.string(), // "PERM" | "NATB"
    displayNameEn: v.string(),
    displayNameFr: v.string(),
    displayNameEs: v.string(),
    displayNameDe: v.string(),
    displayNameNl: v.optional(v.string()),
    displayNamePt: v.optional(v.string()),
    icon: v.optional(v.string()),
  }).index("by_code", ["code"]).index("by_category", ["category"]),

  // ============================================
  // Users & Auth
  // ============================================

  users: defineTable({
    // Identity
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.optional(v.string()), // ISO date string
    gender: v.optional(v.string()), // "M" | "F" | "O" | "P"
    bio: v.optional(v.string()),

    // Profile picture
    profilePicture: v.optional(v.id("_storage")), // Convex file storage
    profilePictureUrl: v.optional(v.string()), // External URL (Google OAuth)

    // Location
    addressId: v.optional(v.id("addresses")),

    // Relations (stored as arrays of IDs)
    languageIds: v.optional(v.array(v.id("languages"))),
    skillIds: v.optional(v.array(v.id("skills"))),

    // Auth
    emailVerified: v.boolean(),
    emailVerificationToken: v.optional(v.string()),
    emailVerificationSentAt: v.optional(v.number()), // timestamp
    hasPassword: v.boolean(), // false for Google-only accounts
    legacyPasswordHash: v.optional(v.string()), // Django PBKDF2 hash (migration)

    // Notification preferences
    emailNotifications: v.boolean(),
    newsletter: v.boolean(),
    inAppNotifications: v.boolean(),
    notificationLanguage: v.string(), // "en" | "fr" | "es" | "de"

    // Profile visibility
    isProfileVisible: v.boolean(),

    // Cached rating stats (updated by review mutations)
    averageRating: v.number(),
    reviewCount: v.number(),

    // Admin
    isStaff: v.boolean(),
    isSuperuser: v.boolean(),
    isActive: v.boolean(),

    // Timestamps
    lastLoginAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_isActive", ["isActive"])
    .searchIndex("search_name", {
      searchField: "firstName",
      filterFields: ["isActive"],
    }),

  addresses: defineTable({
    city: v.optional(v.string()),
    street: v.optional(v.string()),
    streetNumber: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    countryId: v.optional(v.id("countries")),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    formattedAddress: v.optional(v.string()),
  }),

  // ============================================
  // Projects
  // ============================================

  projects: defineTable({
    ownerId: v.id("users"),
    title: v.string(),
    description: v.string(),
    projectType: v.string(), // "PERM" | "NATB"

    addressId: v.optional(v.id("addresses")),

    hoursPerDay: v.number(), // 1-10
    daysPerWeek: v.number(), // 1-7
    maxHelpers: v.number(), // min 1

    accommodationDetails: v.optional(v.string()),
    foodDetails: v.optional(v.string()),

    internetProvided: v.boolean(),
    familyFriendly: v.boolean(),
    petsAllowed: v.boolean(),
    smokingAllowed: v.boolean(),

    skillIds: v.array(v.id("skills")),

    isActive: v.boolean(),
    flaggedCount: v.number(),

    // Admin validation
    status: v.string(), // "PENDING" | "ACTIVE" | "REJECTED"
    rejectionReason: v.optional(v.string()),
    validatedAt: v.optional(v.number()),
    validatedBy: v.optional(v.id("users")),

    updatedAt: v.optional(v.number()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_status_active", ["status", "isActive"])
    .index("by_type_active", ["projectType", "isActive"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["status", "isActive"],
    }),

  availability: defineTable({
    projectId: v.id("projects"),
    year: v.number(),
    january: v.boolean(),
    february: v.boolean(),
    march: v.boolean(),
    april: v.boolean(),
    may: v.boolean(),
    june: v.boolean(),
    july: v.boolean(),
    august: v.boolean(),
    september: v.boolean(),
    october: v.boolean(),
    november: v.boolean(),
    december: v.boolean(),
  }).index("by_project", ["projectId"]),

  projectImages: defineTable({
    projectId: v.id("projects"),
    storageId: v.id("_storage"), // Convex file storage
    order: v.number(), // 0 = cover image
  }).index("by_project", ["projectId"]),

  // ============================================
  // Participations
  // ============================================

  participationRequests: defineTable({
    volunteerId: v.id("users"),
    projectId: v.id("projects"),
    status: v.string(), // "PENDING" | "ACCEPTED" | "REFUSED" | "CANCELLED" | "EXPIRED"
    motivation: v.string(),
    proposedStartDate: v.optional(v.string()), // ISO date
    proposedEndDate: v.optional(v.string()), // ISO date
    hostResponseMessage: v.optional(v.string()),
    respondedAt: v.optional(v.number()),
  })
    .index("by_project", ["projectId"])
    .index("by_project_status", ["projectId", "status"])
    .index("by_volunteer", ["volunteerId"])
    .index("by_volunteer_status", ["volunteerId", "status"]),

  // ============================================
  // Messaging
  // ============================================

  conversations: defineTable({
    user1Id: v.id("users"),
    user2Id: v.id("users"),
    participationRequestId: v.optional(v.id("participationRequests")),

    lastMessageText: v.optional(v.string()),
    lastMessageAt: v.optional(v.number()),

    unreadCountUser1: v.number(),
    unreadCountUser2: v.number(),

    // Anti-spam: last email notification timestamps
    lastEmailSentToUser1: v.optional(v.number()),
    lastEmailSentToUser2: v.optional(v.number()),

    // Mute
    user1Muted: v.boolean(),
    user2Muted: v.boolean(),
  })
    .index("by_user1", ["user1Id"])
    .index("by_user2", ["user2Id"])
    .index("by_user1_lastMessage", ["user1Id", "lastMessageAt"])
    .index("by_user2_lastMessage", ["user2Id", "lastMessageAt"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    body: v.string(),
  }).index("by_conversation", ["conversationId"]),

  // ============================================
  // Reviews
  // ============================================

  reviews: defineTable({
    writerId: v.id("users"),
    receiverId: v.id("users"),
    rating: v.number(), // 1.0 - 5.0
    feedback: v.string(),
    response: v.optional(v.string()),
    responseDate: v.optional(v.number()),
    isPublished: v.boolean(), // Airbnb-style: published when both reviews exist or 30-day deadline
    updatedAt: v.optional(v.number()),
  })
    .index("by_receiver", ["receiverId"])
    .index("by_writer", ["writerId"])
    .index("by_writer_receiver", ["writerId", "receiverId"]),

  // ============================================
  // Notifications
  // ============================================

  notifications: defineTable({
    recipientId: v.id("users"),
    type: v.string(), // "REVIEW" | "MESSAGE" | "ADMIN" | "PROJECT" | "SYSTEM"
    title: v.string(),
    message: v.string(),
    linkUrl: v.optional(v.string()),
    isRead: v.boolean(),
    readAt: v.optional(v.number()),
  })
    .index("by_recipient", ["recipientId"])
    .index("by_recipient_unread", ["recipientId", "isRead"]),

  // ============================================
  // Favorites
  // ============================================

  favorites: defineTable({
    userId: v.id("users"),
    projectId: v.id("projects"),
  })
    .index("by_user", ["userId"])
    .index("by_user_project", ["userId", "projectId"]),

  // ============================================
  // Reports
  // ============================================

  reports: defineTable({
    reporterId: v.id("users"),
    targetType: v.string(), // "PROJECT" | "USER" | "REVIEW"
    targetId: v.string(), // ID of the reported entity
    reason: v.string(),
    details: v.optional(v.string()),
    status: v.string(), // "PENDING" | "RESOLVED" | "DISMISSED"
    resolvedBy: v.optional(v.id("users")),
    resolvedAt: v.optional(v.number()),
    resolutionNotes: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_target", ["targetType", "targetId"]),

  // ============================================
  // Saved Searches
  // ============================================

  savedSearches: defineTable({
    userId: v.id("users"),
    name: v.optional(v.string()),
    filters: v.string(), // JSON stringified filters
  }).index("by_user", ["userId"]),

  // ============================================
  // Auth Sessions
  // ============================================

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(), // random session token
    expiresAt: v.number(), // timestamp
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  // ============================================
  // Password Reset Tokens
  // ============================================

  passwordResetTokens: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    used: v.boolean(),
  }).index("by_token", ["token"]),

  // ============================================
  // Typing Indicators (ephemeral)
  // ============================================

  typingIndicators: defineTable({
    userId: v.id("users"),
    conversationId: v.id("conversations"),
    expiresAt: v.number(), // timestamp, auto-cleanup
  }).index("by_conversation", ["conversationId"]),
});
