import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { FEEDBACK_RESULTS } from "./lib/missionConstants";

async function getUserFromToken(ctx: any, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) return null;
  return await ctx.db.get(session.userId);
}

const MAX_TEXT = 500;

// ============================================
// Submit (host-only, mission must be COMPLETED)
// ============================================

export const submit = mutation({
  args: {
    token: v.string(),
    missionId: v.id("missions"),
    totalCostEUR: v.optional(v.number()),
    surfaceM2: v.optional(v.number()),
    result: v.optional(v.string()),
    difficultiesText: v.optional(v.string()),
    learningsText: v.optional(v.string()),
    photoIds: v.optional(v.array(v.id("_storage"))),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const mission = await ctx.db.get(args.missionId);
    if (!mission || mission.ownerId !== user._id) throw new Error("Not authorized.");
    if (mission.status !== "COMPLETED") {
      throw new Error("Mission must be COMPLETED before submitting feedback.");
    }

    if (args.result && !(FEEDBACK_RESULTS as readonly string[]).includes(args.result)) {
      throw new Error(`Invalid result: ${args.result}`);
    }
    if (args.difficultiesText && args.difficultiesText.length > MAX_TEXT) {
      throw new Error(`difficultiesText exceeds ${MAX_TEXT} chars.`);
    }
    if (args.learningsText && args.learningsText.length > MAX_TEXT) {
      throw new Error(`learningsText exceeds ${MAX_TEXT} chars.`);
    }

    // Compute actualDurationDays from mission dates
    const start = new Date(mission.startDate).getTime();
    const end = new Date(mission.endDate).getTime();
    const days = Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1);

    const existing = await ctx.db
      .query("missionFeedback")
      .withIndex("by_mission", (q) => q.eq("missionId", args.missionId))
      .first();

    const payload = {
      missionId: args.missionId,
      totalCostEUR: args.totalCostEUR,
      surfaceM2: args.surfaceM2,
      actualDurationDays: days,
      result: args.result,
      difficultiesText: args.difficultiesText,
      learningsText: args.learningsText,
      photoIds: args.photoIds || [],
      isPublic: args.isPublic,
      submittedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
    } else {
      await ctx.db.insert("missionFeedback", payload);
    }

    // Notify accepted helpers that feedback is published
    if (args.isPublic) {
      const accepted = await ctx.db
        .query("participationRequests")
        .withIndex("by_mission_status", (q) =>
          q.eq("missionId", args.missionId).eq("status", "ACCEPTED")
        )
        .collect();
      for (const req of accepted) {
        await ctx.db.insert("notifications", {
          recipientId: req.volunteerId,
          type: "MISSION",
          title: `Feedback published: ${mission.title}`,
          message: "The host has shared a feedback on your mission.",
          linkUrl: `/missions/${args.missionId}`,
          isRead: false,
        });
      }
    }

    return { success: true };
  },
});

// ============================================
// Get feedback by mission
// ============================================

export const getByMissionId = query({
  args: { missionId: v.id("missions") },
  handler: async (ctx, args) => {
    const fb = await ctx.db
      .query("missionFeedback")
      .withIndex("by_mission", (q) => q.eq("missionId", args.missionId))
      .first();
    if (!fb) return null;
    // Resolve photo URLs
    const photoUrls: string[] = [];
    for (const id of fb.photoIds || []) {
      const url = await ctx.storage.getUrl(id);
      if (url) photoUrls.push(url);
    }
    return { ...fb, photoUrls };
  },
});

// ============================================
// Set visibility (host only)
// ============================================

export const setVisibility = mutation({
  args: {
    token: v.string(),
    feedbackId: v.id("missionFeedback"),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const fb = await ctx.db.get(args.feedbackId);
    if (!fb) throw new Error("Feedback not found.");
    const mission = await ctx.db.get(fb.missionId);
    if (!mission || mission.ownerId !== user._id) throw new Error("Not authorized.");

    await ctx.db.patch(args.feedbackId, { isPublic: args.isPublic });
    return { success: true };
  },
});

// ============================================
// Upload helper for feedback photos
// ============================================

export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");
    return await ctx.storage.generateUploadUrl();
  },
});

// ============================================
// Helper photos (opt-in publication by helpers post-mission)
// ============================================

export const submitHelperPhoto = mutation({
  args: {
    token: v.string(),
    missionId: v.id("missions"),
    storageId: v.id("_storage"),
    isPublic: v.boolean(),
    caption: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    // Verify the user is an accepted helper for this mission
    const accepted = await ctx.db
      .query("participationRequests")
      .withIndex("by_volunteer_status", (q) =>
        q.eq("volunteerId", user._id).eq("status", "ACCEPTED")
      )
      .collect();
    if (!accepted.find((r) => r.missionId === args.missionId)) {
      throw new Error("You must be an accepted helper of this mission to upload photos.");
    }

    await ctx.db.insert("helperMissionPhotos", {
      missionId: args.missionId,
      helperId: user._id,
      storageId: args.storageId,
      isPublic: args.isPublic,
      caption: args.caption,
    });
    return { success: true };
  },
});

export const setHelperPhotoVisibility = mutation({
  args: {
    token: v.string(),
    photoId: v.id("helperMissionPhotos"),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const photo = await ctx.db.get(args.photoId);
    if (!photo || photo.helperId !== user._id) throw new Error("Not authorized.");

    await ctx.db.patch(args.photoId, { isPublic: args.isPublic });
    return { success: true };
  },
});

export const removeHelperPhoto = mutation({
  args: { token: v.string(), photoId: v.id("helperMissionPhotos") },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const photo = await ctx.db.get(args.photoId);
    if (!photo || photo.helperId !== user._id) throw new Error("Not authorized.");

    await ctx.storage.delete(photo.storageId);
    await ctx.db.delete(args.photoId);
    return { success: true };
  },
});

export const getHelperPhotos = query({
  args: { missionId: v.id("missions"), publicOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const photos = await ctx.db
      .query("helperMissionPhotos")
      .withIndex("by_mission", (q) => q.eq("missionId", args.missionId))
      .collect();
    const filtered = args.publicOnly ? photos.filter((p) => p.isPublic) : photos;

    const enriched = [];
    for (const p of filtered) {
      const helper = await ctx.db.get(p.helperId);
      const url = await ctx.storage.getUrl(p.storageId);
      enriched.push({
        ...p,
        url,
        helper: helper
          ? { _id: helper._id, firstName: helper.firstName, lastName: helper.lastName }
          : null,
      });
    }
    return enriched;
  },
});

export const getMyHelperPhotos = query({
  args: { token: v.string(), missionId: v.id("missions") },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return [];
    const photos = await ctx.db
      .query("helperMissionPhotos")
      .withIndex("by_helper", (q) => q.eq("helperId", user._id))
      .collect();
    const forMission = photos.filter((p) => p.missionId === args.missionId);
    return await Promise.all(
      forMission.map(async (p) => ({
        ...p,
        url: await ctx.storage.getUrl(p.storageId),
      }))
    );
  },
});
