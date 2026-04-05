import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// Helper: get user from session token
// ============================================

async function getUserFromToken(ctx: any, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) return null;
  return await ctx.db.get(session.userId);
}

// ============================================
// Get User by ID (public profile)
// ============================================

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user || !user.isActive) return null;

    // Get address with country
    let address = null;
    if (user.addressId) {
      const addr = await ctx.db.get(user.addressId);
      if (addr) {
        let country = null;
        if (addr.countryId) country = await ctx.db.get(addr.countryId);
        address = { ...addr, country };
      }
    }

    // Get skills
    const skills = [];
    if (user.skillIds) {
      for (const skillId of user.skillIds) {
        const skill = await ctx.db.get(skillId);
        if (skill) skills.push(skill);
      }
    }

    // Get languages
    const languages = [];
    if (user.languageIds) {
      for (const langId of user.languageIds) {
        const lang = await ctx.db.get(langId);
        if (lang) languages.push(lang);
      }
    }

    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
      profilePicture: user.profilePicture,
      profilePictureUrl: user.profilePictureUrl,
      address,
      languages,
      skills,
      averageRating: user.averageRating,
      reviewCount: user.reviewCount,
      _creationTime: user._creationTime,
    };
  },
});

// ============================================
// Update Profile
// ============================================

export const updateProfile = mutation({
  args: {
    token: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.string()),
    bio: v.optional(v.string()),
    languageIds: v.optional(v.array(v.id("languages"))),
    skillIds: v.optional(v.array(v.id("skills"))),
    isProfileVisible: v.optional(v.boolean()),
    // Address fields
    city: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    street: v.optional(v.string()),
    streetNumber: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    formattedAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const updates: any = {};
    if (args.firstName !== undefined) updates.firstName = args.firstName;
    if (args.lastName !== undefined) updates.lastName = args.lastName;
    if (args.dateOfBirth !== undefined) updates.dateOfBirth = args.dateOfBirth;
    if (args.gender !== undefined) updates.gender = args.gender;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.languageIds !== undefined) updates.languageIds = args.languageIds;
    if (args.skillIds !== undefined) updates.skillIds = args.skillIds;
    if (args.isProfileVisible !== undefined) updates.isProfileVisible = args.isProfileVisible;
    updates.updatedAt = Date.now();

    // Handle address
    if (args.city !== undefined || args.postalCode !== undefined) {
      let countryId = undefined;
      if (args.countryCode) {
        const country = await ctx.db
          .query("countries")
          .withIndex("by_code", (q) => q.eq("code", args.countryCode!))
          .first();
        if (country) countryId = country._id;
      }

      if (user.addressId) {
        // Update existing address
        await ctx.db.patch(user.addressId, {
          city: args.city,
          postalCode: args.postalCode,
          countryId,
          street: args.street,
          streetNumber: args.streetNumber,
          latitude: args.latitude,
          longitude: args.longitude,
          formattedAddress: args.formattedAddress,
        });
      } else {
        // Create new address
        const addressId = await ctx.db.insert("addresses", {
          city: args.city,
          postalCode: args.postalCode,
          countryId,
          street: args.street,
          streetNumber: args.streetNumber,
          latitude: args.latitude,
          longitude: args.longitude,
          formattedAddress: args.formattedAddress,
        });
        updates.addressId = addressId;
      }
    }

    await ctx.db.patch(user._id, updates);
    return { success: true };
  },
});

// ============================================
// Update Notification Settings
// ============================================

export const updateSettings = mutation({
  args: {
    token: v.string(),
    emailNotifications: v.optional(v.boolean()),
    newsletter: v.optional(v.boolean()),
    inAppNotifications: v.optional(v.boolean()),
    notificationLanguage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const updates: any = { updatedAt: Date.now() };
    if (args.emailNotifications !== undefined) updates.emailNotifications = args.emailNotifications;
    if (args.newsletter !== undefined) updates.newsletter = args.newsletter;
    if (args.inAppNotifications !== undefined) updates.inAppNotifications = args.inAppNotifications;
    if (args.notificationLanguage !== undefined) updates.notificationLanguage = args.notificationLanguage;

    await ctx.db.patch(user._id, updates);
    return { success: true };
  },
});

// ============================================
// Get User Stats
// ============================================

export const getStats = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return null;

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    const reviewsWritten = await ctx.db
      .query("reviews")
      .withIndex("by_writer", (q) => q.eq("writerId", user._id))
      .collect();

    const reviewsReceived = await ctx.db
      .query("reviews")
      .withIndex("by_receiver", (q) => q.eq("receiverId", user._id))
      .collect();

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      projectCount: projects.length,
      activeProjectCount: projects.filter((p) => p.status === "ACTIVE").length,
      reviewsWrittenCount: reviewsWritten.length,
      reviewsReceivedCount: reviewsReceived.length,
      favoriteCount: favorites.length,
      averageRating: user.averageRating,
      reviewCount: user.reviewCount,
    };
  },
});
