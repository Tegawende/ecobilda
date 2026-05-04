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
    notificationLanguage: v.string(), // "en" | "fr" | "es" | "de" | "nl" | "pt"

    // Profile visibility
    isProfileVisible: v.boolean(),

    // Cached rating stats (updated by review mutations)
    averageRating: v.number(),
    reviewCount: v.number(),

    // Public profile ID (16-digit numeric string, Airbnb-style URL)
    publicId: v.optional(v.string()),

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
    .index("by_public_id", ["publicId"])
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
  // Projects (= host's place / lieu d'accueil)
  //
  // Lightweight container that describes WHERE the host welcomes helpers.
  // The actual bookable units are stored in `missions`.
  // ============================================

  projects: defineTable({
    ownerId: v.id("users"),
    title: v.string(), // place name, e.g. "Le Domaine des Sources"

    addressId: v.optional(v.id("addresses")),

    accommodationDetails: v.optional(v.string()),
    foodDetails: v.optional(v.string()),

    internetProvided: v.boolean(),
    familyFriendly: v.boolean(),
    petsAllowed: v.boolean(),
    smokingAllowed: v.boolean(),

    languageIds: v.optional(v.array(v.id("languages"))),

    isActive: v.boolean(),
    flaggedCount: v.number(),

    // Admin validation (one-shot per place)
    status: v.string(), // "PENDING" | "ACTIVE" | "REJECTED"
    rejectionReason: v.optional(v.string()),
    validatedAt: v.optional(v.number()),
    validatedBy: v.optional(v.id("users")),

    updatedAt: v.optional(v.number()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_status_active", ["status", "isActive"]),

  projectImages: defineTable({
    projectId: v.id("projects"),
    storageId: v.optional(v.id("_storage")),
    url: v.optional(v.string()),
    order: v.number(), // 0 = cover image
  }).index("by_project", ["projectId"]),

  // ============================================
  // Missions (= bookable work unit on a project)
  //
  // Each mission has its own dates, type, difficulty, etc.
  // This is the searchable / filterable / map-displayed unit.
  // ============================================

  missions: defineTable({
    projectId: v.id("projects"),
    ownerId: v.id("users"), // denormalized for cheap by_owner queries

    type: v.string(), // "CHANTIER" | "FORMATION"
    title: v.string(),
    description: v.string(),

    // CHANTIER-only fields
    poste: v.optional(v.string()), // fondations | murs | toiture | sol | isolation | enduits | menuiseries | exterieur | autre
    technique: v.optional(v.string()), // contextual to poste

    difficulty: v.string(), // "DEBUTANT" | "INTERMEDIAIRE" | "EXPERT"

    // Pricing (mainly for FORMATION)
    pricingMode: v.string(), // "FREE" | "PAID"
    priceEUR: v.optional(v.number()),

    // Dates
    startDate: v.string(), // ISO
    endDate: v.string(), // ISO

    maxParticipants: v.number(),
    hoursPerDay: v.number(),
    daysPerWeek: v.number(),

    skillIds: v.array(v.id("skills")),

    coverImageId: v.optional(v.id("_storage")),

    // Status state machine
    status: v.string(), // "DRAFT" | "PUBLISHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
    cancellationReason: v.optional(v.string()),

    // Cron lifecycle tracking
    feedbackNotifiedAt: v.optional(v.number()),
    feedbackReminderSentAt: v.optional(v.number()),
    feedbackDeadlineAt: v.optional(v.number()),

    updatedAt: v.optional(v.number()),
  })
    .index("by_project", ["projectId"])
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_status_published", ["status", "startDate"])
    .index("by_type_status", ["type", "status"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["status", "type"],
    }),

  missionImages: defineTable({
    missionId: v.id("missions"),
    storageId: v.optional(v.id("_storage")),
    url: v.optional(v.string()),
    order: v.number(), // 0 = cover image
  }).index("by_mission", ["missionId"]),

  // 1-1 with mission, filled by host post-completion
  missionFeedback: defineTable({
    missionId: v.id("missions"),
    totalCostEUR: v.optional(v.number()),
    surfaceM2: v.optional(v.number()),
    actualDurationDays: v.optional(v.number()),
    result: v.optional(v.string()), // "SUCCESS" | "PARTIAL_SUCCESS" | "FAILURE"
    difficultiesText: v.optional(v.string()), // max 500
    learningsText: v.optional(v.string()), // max 500
    photoIds: v.optional(v.array(v.id("_storage"))),
    isPublic: v.boolean(),
    submittedAt: v.number(),
  })
    .index("by_mission", ["missionId"])
    .index("by_public_submitted", ["isPublic", "submittedAt"]),

  // Photos uploaded by helpers post-mission, opt-in publication
  helperMissionPhotos: defineTable({
    missionId: v.id("missions"),
    helperId: v.id("users"),
    storageId: v.id("_storage"),
    isPublic: v.boolean(), // default false, helper opts in
    caption: v.optional(v.string()),
  })
    .index("by_mission", ["missionId"])
    .index("by_helper", ["helperId"])
    .index("by_mission_public", ["missionId", "isPublic"]),

  // ============================================
  // Participations
  //
  // Now references missionId (was projectId). One participation per mission per volunteer.
  // ============================================

  participationRequests: defineTable({
    volunteerId: v.id("users"),
    missionId: v.id("missions"),
    status: v.string(), // "PENDING" | "ACCEPTED" | "REFUSED" | "CANCELLED" | "EXPIRED"
    motivation: v.string(),
    proposedStartDate: v.optional(v.string()),
    proposedEndDate: v.optional(v.string()),
    hostResponseMessage: v.optional(v.string()),
    respondedAt: v.optional(v.number()),
  })
    .index("by_mission", ["missionId"])
    .index("by_mission_status", ["missionId", "status"])
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

    // Read receipts
    user1LastReadAt: v.optional(v.number()),
    user2LastReadAt: v.optional(v.number()),
  })
    .index("by_user1", ["user1Id"])
    .index("by_user2", ["user2Id"])
    .index("by_user1_lastMessage", ["user1Id", "lastMessageAt"])
    .index("by_user2_lastMessage", ["user2Id", "lastMessageAt"])
    .index("by_participation_request", ["participationRequestId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    body: v.string(),
    isSystem: v.optional(v.boolean()),
    imageStorageId: v.optional(v.id("_storage")),
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
    isPublished: v.boolean(),
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
    type: v.string(), // "REVIEW" | "MESSAGE" | "ADMIN" | "PROJECT" | "MISSION" | "SYSTEM"
    title: v.string(),
    message: v.string(),
    linkUrl: v.optional(v.string()),
    isRead: v.boolean(),
    readAt: v.optional(v.number()),
  })
    .index("by_recipient", ["recipientId"])
    .index("by_recipient_unread", ["recipientId", "isRead"]),

  // ============================================
  // Favorites (now on missions)
  // ============================================

  favorites: defineTable({
    userId: v.id("users"),
    missionId: v.id("missions"),
  })
    .index("by_user", ["userId"])
    .index("by_user_mission", ["userId", "missionId"]),

  // ============================================
  // Reports
  // ============================================

  reports: defineTable({
    reporterId: v.id("users"),
    targetType: v.string(), // "PROJECT" | "MISSION" | "USER" | "REVIEW"
    targetId: v.string(),
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
  // Contact Messages
  // ============================================

  contactMessages: defineTable({
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
    status: v.optional(v.string()), // "new", "read", "resolved"
  }),

  // ============================================
  // Auth Sessions
  // ============================================

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
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
    expiresAt: v.number(),
  }).index("by_conversation", ["conversationId"]),
});
