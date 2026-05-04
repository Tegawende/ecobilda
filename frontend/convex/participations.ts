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

// Enrich participation with mission, place, host and volunteer data
async function enrichParticipation(ctx: any, participation: any) {
  const mission = await ctx.db.get(participation.missionId);
  const volunteer = await ctx.db.get(participation.volunteerId);

  let project: any = null;
  let projectAddress: any = null;
  let coverImageUrl: string | null = null;
  let host: any = null;

  if (mission) {
    project = await ctx.db.get(mission.projectId);
    if (project?.addressId) {
      const addr = await ctx.db.get(project.addressId);
      if (addr) {
        const country = addr.countryId ? await ctx.db.get(addr.countryId) : null;
        projectAddress = { ...addr, country };
      }
    }

    // Mission cover (storage or first image)
    if (mission.coverImageId) {
      coverImageUrl = await ctx.storage.getUrl(mission.coverImageId);
    } else {
      const firstImg = await ctx.db
        .query("missionImages")
        .withIndex("by_mission", (q: any) => q.eq("missionId", mission._id))
        .first();
      if (firstImg) {
        coverImageUrl =
          firstImg.url ?? (firstImg.storageId ? await ctx.storage.getUrl(firstImg.storageId) : null);
      }
    }

    // Host
    const owner = await ctx.db.get(mission.ownerId);
    if (owner) {
      let hostPictureUrl = owner.profilePictureUrl ?? null;
      if (owner.profilePicture && !hostPictureUrl) {
        hostPictureUrl = await ctx.storage.getUrl(owner.profilePicture);
      }
      host = {
        _id: owner._id,
        publicId: owner.publicId,
        firstName: owner.firstName,
        lastName: owner.lastName,
        profilePictureUrl: hostPictureUrl,
        averageRating: owner.averageRating,
        reviewCount: owner.reviewCount,
      };
    }
  }

  return {
    ...participation,
    mission: mission
      ? {
          _id: mission._id,
          title: mission.title,
          type: mission.type,
          poste: mission.poste,
          technique: mission.technique,
          difficulty: mission.difficulty,
          startDate: mission.startDate,
          endDate: mission.endDate,
          maxParticipants: mission.maxParticipants,
          status: mission.status,
          coverImageUrl,
        }
      : null,
    project: project
      ? {
          _id: project._id,
          title: project.title,
          ownerId: project.ownerId,
          address: projectAddress,
        }
      : null,
    host,
    volunteer: volunteer
      ? {
          _id: volunteer._id,
          firstName: volunteer.firstName,
          lastName: volunteer.lastName,
          profilePicture: volunteer.profilePicture,
          profilePictureUrl: volunteer.profilePictureUrl,
          averageRating: volunteer.averageRating,
          reviewCount: volunteer.reviewCount,
        }
      : null,
  };
}

async function getConversationByRequest(ctx: any, requestId: any) {
  return await ctx.db
    .query("conversations")
    .withIndex("by_participation_request", (q: any) =>
      q.eq("participationRequestId", requestId)
    )
    .first();
}

// ============================================
// Get single participation request
// ============================================

export const getById = query({
  args: { token: v.string(), id: v.id("participationRequests") },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return null;
    const request = await ctx.db.get(args.id);
    if (!request) return null;
    const mission = await ctx.db.get(request.missionId);
    if (!mission) return null;
    if (request.volunteerId !== user._id && mission.ownerId !== user._id) return null;
    return await enrichParticipation(ctx, request);
  },
});

// ============================================
// My Requests (as volunteer)
// ============================================

export const getMyRequests = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return [];

    const requests = await ctx.db
      .query("participationRequests")
      .withIndex("by_volunteer", (q) => q.eq("volunteerId", user._id))
      .collect();

    return await Promise.all(requests.map((r) => enrichParticipation(ctx, r)));
  },
});

// ============================================
// Received Requests (as host)
// ============================================

export const getReceivedRequests = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return [];

    const myMissions = await ctx.db
      .query("missions")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    const all: any[] = [];
    for (const m of myMissions) {
      const reqs = await ctx.db
        .query("participationRequests")
        .withIndex("by_mission", (q) => q.eq("missionId", m._id))
        .collect();
      for (const r of reqs) {
        all.push(await enrichParticipation(ctx, r));
      }
    }
    return all.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// ============================================
// Create Request → creates conversation + first message
// ============================================

export const create = mutation({
  args: {
    token: v.string(),
    missionId: v.id("missions"),
    motivation: v.string(),
    proposedStartDate: v.optional(v.string()),
    proposedEndDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const mission = await ctx.db.get(args.missionId);
    if (!mission) throw new Error("Mission not found.");
    if (mission.ownerId === user._id) throw new Error("Cannot apply to your own mission.");
    if (mission.status !== "PUBLISHED") throw new Error("Mission is not open to applications.");

    // Duplicate guard
    const existing = await ctx.db
      .query("participationRequests")
      .withIndex("by_volunteer_status", (q) =>
        q.eq("volunteerId", user._id).eq("status", "PENDING")
      )
      .collect();
    if (existing.find((r) => r.missionId === args.missionId)) {
      throw new Error("You already have a pending request for this mission.");
    }

    const requestId = await ctx.db.insert("participationRequests", {
      volunteerId: user._id,
      missionId: args.missionId,
      status: "PENDING",
      motivation: args.motivation,
      proposedStartDate: args.proposedStartDate,
      proposedEndDate: args.proposedEndDate,
    });

    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      user1Id: mission.ownerId,
      user2Id: user._id,
      participationRequestId: requestId,
      lastMessageText: args.motivation,
      lastMessageAt: now,
      unreadCountUser1: 1,
      unreadCountUser2: 0,
      user1Muted: false,
      user2Muted: false,
    });

    await ctx.db.insert("messages", {
      conversationId,
      senderId: user._id,
      body: args.motivation,
    });

    await ctx.db.insert("notifications", {
      recipientId: mission.ownerId,
      type: "MISSION",
      title: `New application from ${user.firstName} ${user.lastName}`,
      message: args.motivation.slice(0, 200),
      linkUrl: `/messages/${conversationId}`,
      isRead: false,
    });

    return { requestId, conversationId };
  },
});

// ============================================
// Accept (host)
// ============================================

export const accept = mutation({
  args: {
    token: v.string(),
    requestId: v.id("participationRequests"),
    responseMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found.");

    const mission = await ctx.db.get(request.missionId);
    if (!mission || mission.ownerId !== user._id) throw new Error("Not authorized.");

    await ctx.db.patch(args.requestId, {
      status: "ACCEPTED",
      hostResponseMessage: args.responseMessage,
      respondedAt: Date.now(),
    });

    const conversation = await getConversationByRequest(ctx, args.requestId);
    if (conversation) {
      const acceptMsg = args.responseMessage
        ? args.responseMessage
        : `${user.firstName} accepted your application for "${mission.title}".`;
      const now = Date.now();
      await ctx.db.insert("messages", {
        conversationId: conversation._id,
        senderId: user._id,
        body: acceptMsg,
        isSystem: true,
      });
      await ctx.db.patch(conversation._id, {
        lastMessageText: acceptMsg,
        lastMessageAt: now,
        unreadCountUser2: (conversation.unreadCountUser2 ?? 0) + 1,
      });

      await ctx.db.insert("notifications", {
        recipientId: request.volunteerId,
        type: "MISSION",
        title: `Your application was accepted!`,
        message: `${user.firstName} accepted your application for "${mission.title}"`,
        linkUrl: `/messages/${conversation._id}`,
        isRead: false,
      });
    }

    return { success: true };
  },
});

// ============================================
// Refuse (host)
// ============================================

export const refuse = mutation({
  args: {
    token: v.string(),
    requestId: v.id("participationRequests"),
    responseMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found.");

    const mission = await ctx.db.get(request.missionId);
    if (!mission || mission.ownerId !== user._id) throw new Error("Not authorized.");

    await ctx.db.patch(args.requestId, {
      status: "REFUSED",
      hostResponseMessage: args.responseMessage,
      respondedAt: Date.now(),
    });

    const conversation = await getConversationByRequest(ctx, args.requestId);
    if (conversation) {
      const refuseMsg = args.responseMessage
        ? args.responseMessage
        : `${user.firstName} declined your application for "${mission.title}".`;
      const now = Date.now();
      await ctx.db.insert("messages", {
        conversationId: conversation._id,
        senderId: user._id,
        body: refuseMsg,
        isSystem: true,
      });
      await ctx.db.patch(conversation._id, {
        lastMessageText: refuseMsg,
        lastMessageAt: now,
        unreadCountUser2: (conversation.unreadCountUser2 ?? 0) + 1,
      });

      await ctx.db.insert("notifications", {
        recipientId: request.volunteerId,
        type: "MISSION",
        title: `Your application was declined`,
        message: `${user.firstName} declined your application for "${mission.title}"`,
        linkUrl: `/messages/${conversation._id}`,
        isRead: false,
      });
    }

    return { success: true };
  },
});

// ============================================
// Cancel (volunteer)
// ============================================

export const cancel = mutation({
  args: {
    token: v.string(),
    requestId: v.id("participationRequests"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const request = await ctx.db.get(args.requestId);
    if (!request || request.volunteerId !== user._id) throw new Error("Not authorized.");

    await ctx.db.patch(args.requestId, { status: "CANCELLED" });

    // Notify host
    const mission = await ctx.db.get(request.missionId);
    if (mission) {
      await ctx.db.insert("notifications", {
        recipientId: mission.ownerId,
        type: "MISSION",
        title: `Application cancelled`,
        message: `${user.firstName} ${user.lastName} cancelled their application for "${mission.title}".`,
        linkUrl: `/missions/${mission._id}`,
        isRead: false,
      });
    }

    return { success: true };
  },
});
