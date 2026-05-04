import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

async function getUserFromToken(ctx: any, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) return null;
  return await ctx.db.get(session.userId);
}

// ============================================
// List Conversations for User (reactive)
// ============================================

export const listForUser = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return [];

    // Get conversations where user is user1 or user2
    const asUser1 = await ctx.db
      .query("conversations")
      .withIndex("by_user1", (q) => q.eq("user1Id", user._id))
      .collect();
    const asUser2 = await ctx.db
      .query("conversations")
      .withIndex("by_user2", (q) => q.eq("user2Id", user._id))
      .collect();

    const all = [...asUser1, ...asUser2];

    // Enrich with other user data
    const enriched = [];
    for (const conv of all) {
      const otherUserId = conv.user1Id === user._id ? conv.user2Id : conv.user1Id;
      const otherUser = await ctx.db.get(otherUserId);
      const unreadCount =
        conv.user1Id === user._id ? conv.unreadCountUser1 : conv.unreadCountUser2;
      const isMuted =
        conv.user1Id === user._id ? conv.user1Muted : conv.user2Muted;

      let otherUserPictureUrl = otherUser?.profilePictureUrl ?? null;
      if (otherUser?.profilePicture && !otherUserPictureUrl) {
        otherUserPictureUrl = await ctx.storage.getUrl(otherUser.profilePicture);
      }

      enriched.push({
        ...conv,
        otherUser: otherUser
          ? {
              _id: otherUser._id,
              publicId: otherUser.publicId,
              firstName: otherUser.firstName,
              lastName: otherUser.lastName,
              profilePictureUrl: otherUserPictureUrl,
            }
          : null,
        unreadCount,
        isMuted,
      });
    }

    // Sort by last message
    return enriched.sort(
      (a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0)
    );
  },
});

// ============================================
// Get Single Conversation
// ============================================

export const getById = query({
  args: { token: v.string(), id: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return null;

    const conv = await ctx.db.get(args.id);
    if (!conv) return null;
    if (conv.user1Id !== user._id && conv.user2Id !== user._id) return null;

    const otherUserId = conv.user1Id === user._id ? conv.user2Id : conv.user1Id;
    const otherUser = await ctx.db.get(otherUserId);

    let otherUserPictureUrl = otherUser?.profilePictureUrl ?? null;
    if (otherUser?.profilePicture && !otherUserPictureUrl) {
      otherUserPictureUrl = await ctx.storage.getUrl(otherUser.profilePicture);
    }

    // Enrich with participation request and mission details
    let participationDetails: any = null;
    if (conv.participationRequestId) {
      const req = await ctx.db.get(conv.participationRequestId);
      if (req) {
        const mission = await ctx.db.get(req.missionId);
        let coverImageUrl: string | null = null;
        let projectAddress: any = null;
        if (mission) {
          // Mission cover image (storage or first mission image)
          if (mission.coverImageId) {
            coverImageUrl = await ctx.storage.getUrl(mission.coverImageId);
          } else {
            const coverImg = await ctx.db
              .query("missionImages")
              .withIndex("by_mission", (q) => q.eq("missionId", mission._id))
              .order("asc")
              .first();
            if (coverImg) {
              coverImageUrl =
                coverImg.url ?? (coverImg.storageId ? await ctx.storage.getUrl(coverImg.storageId) : null);
            }
          }
          // Project address via mission.projectId
          const project = await ctx.db.get(mission.projectId);
          if (project?.addressId) {
            const addr = await ctx.db.get(project.addressId);
            if (addr) {
              let country = null;
              if (addr.countryId) country = await ctx.db.get(addr.countryId);
              projectAddress = { city: addr.city, country: country ? { name: country.name } : null };
            }
          }
        }
        participationDetails = {
          _id: req._id,
          proposedStartDate: req.proposedStartDate ?? null,
          proposedEndDate: req.proposedEndDate ?? null,
          status: req.status,
          mission: mission
            ? {
                _id: mission._id,
                title: mission.title,
                type: mission.type,
                startDate: mission.startDate,
                endDate: mission.endDate,
                coverImageUrl,
                address: projectAddress,
              }
            : null,
        };
      }
    }

    return {
      ...conv,
      otherUser: otherUser
        ? {
            _id: otherUser._id,
            publicId: otherUser.publicId,
            firstName: otherUser.firstName,
            lastName: otherUser.lastName,
            profilePictureUrl: otherUserPictureUrl,
          }
        : null,
      participationDetails,
    };
  },
});

// ============================================
// Mark as Read
// ============================================

export const markAsRead = mutation({
  args: { token: v.string(), id: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const conv = await ctx.db.get(args.id);
    if (!conv) throw new Error("Conversation not found.");

    if (conv.user1Id === user._id) {
      await ctx.db.patch(args.id, { unreadCountUser1: 0, user1LastReadAt: Date.now() });
    } else if (conv.user2Id === user._id) {
      await ctx.db.patch(args.id, { unreadCountUser2: 0, user2LastReadAt: Date.now() });
    }
    return { success: true };
  },
});

// ============================================
// Delete Conversation
// ============================================

export const deleteConversation = mutation({
  args: { token: v.string(), id: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const conv = await ctx.db.get(args.id);
    if (!conv) throw new Error("Conversation not found.");
    if (conv.user1Id !== user._id && conv.user2Id !== user._id) {
      throw new Error("Not authorized.");
    }

    // Delete all messages in this conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.id))
      .collect();
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    // Delete the conversation
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ============================================
// Toggle Mute
// ============================================

export const toggleMute = mutation({
  args: { token: v.string(), id: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const conv = await ctx.db.get(args.id);
    if (!conv) throw new Error("Conversation not found.");

    if (conv.user1Id === user._id) {
      await ctx.db.patch(args.id, { user1Muted: !conv.user1Muted });
    } else if (conv.user2Id === user._id) {
      await ctx.db.patch(args.id, { user2Muted: !conv.user2Muted });
    }
    return { success: true };
  },
});

// ============================================
// Generate Upload URL for Message Images
// ============================================

export const generateMessageUploadUrl = mutation({
  args: { token: v.string(), conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error("Conversation not found.");
    if (conv.user1Id !== user._id && conv.user2Id !== user._id) {
      throw new Error("Not authorized.");
    }

    return await ctx.storage.generateUploadUrl();
  },
});
