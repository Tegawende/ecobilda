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

// Enrich participation with project and volunteer data
async function enrichParticipation(ctx: any, participation: any) {
  const project = await ctx.db.get(participation.projectId);
  const volunteer = await ctx.db.get(participation.volunteerId);

  let projectAddress = null;
  if (project?.addressId) {
    const addr = await ctx.db.get(project.addressId);
    if (addr) {
      let country = null;
      if (addr.countryId) country = await ctx.db.get(addr.countryId);
      projectAddress = { ...addr, country };
    }
  }

  return {
    ...participation,
    project: project
      ? {
          _id: project._id,
          title: project.title,
          projectType: project.projectType,
          address: projectAddress,
          ownerId: project.ownerId,
        }
      : null,
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

    const enriched = [];
    for (const r of requests) {
      enriched.push(await enrichParticipation(ctx, r));
    }
    return enriched;
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

    // Get all projects owned by user
    const myProjects = await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    const allRequests = [];
    for (const project of myProjects) {
      const requests = await ctx.db
        .query("participationRequests")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();
      for (const r of requests) {
        allRequests.push(await enrichParticipation(ctx, r));
      }
    }

    return allRequests.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// ============================================
// Create Request
// ============================================

export const create = mutation({
  args: {
    token: v.string(),
    projectId: v.id("projects"),
    motivation: v.string(),
    proposedStartDate: v.optional(v.string()),
    proposedEndDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found.");
    if (project.ownerId === user._id) {
      throw new Error("Cannot apply to your own project.");
    }
    if (project.status !== "ACTIVE") {
      throw new Error("Project is not active.");
    }

    // Check for duplicate pending request
    const existing = await ctx.db
      .query("participationRequests")
      .withIndex("by_volunteer_status", (q) =>
        q.eq("volunteerId", user._id).eq("status", "PENDING")
      )
      .collect();
    const duplicate = existing.find((r) => r.projectId === args.projectId);
    if (duplicate) {
      throw new Error("You already have a pending request for this project.");
    }

    const requestId = await ctx.db.insert("participationRequests", {
      volunteerId: user._id,
      projectId: args.projectId,
      status: "PENDING",
      motivation: args.motivation,
      proposedStartDate: args.proposedStartDate,
      proposedEndDate: args.proposedEndDate,
    });

    // Create notification for host
    await ctx.db.insert("notifications", {
      recipientId: project.ownerId,
      type: "PROJECT",
      title: `New participation request from ${user.firstName}`,
      message: args.motivation.slice(0, 200),
      linkUrl: "/participations",
      isRead: false,
    });

    return requestId;
  },
});

// ============================================
// Accept Request (host only)
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

    const project = await ctx.db.get(request.projectId);
    if (!project || project.ownerId !== user._id) {
      throw new Error("Not authorized.");
    }

    await ctx.db.patch(args.requestId, {
      status: "ACCEPTED",
      hostResponseMessage: args.responseMessage,
      respondedAt: Date.now(),
    });

    // Create conversation
    await ctx.db.insert("conversations", {
      user1Id: user._id,
      user2Id: request.volunteerId,
      participationRequestId: args.requestId,
      unreadCountUser1: 0,
      unreadCountUser2: 0,
      user1Muted: false,
      user2Muted: false,
    });

    // Notify volunteer
    await ctx.db.insert("notifications", {
      recipientId: request.volunteerId,
      type: "PROJECT",
      title: `Your request was accepted!`,
      message: `${user.firstName} accepted your participation request for "${project.title}"`,
      linkUrl: "/messages",
      isRead: false,
    });

    return { success: true };
  },
});

// ============================================
// Refuse Request (host only)
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

    const project = await ctx.db.get(request.projectId);
    if (!project || project.ownerId !== user._id) {
      throw new Error("Not authorized.");
    }

    await ctx.db.patch(args.requestId, {
      status: "REFUSED",
      hostResponseMessage: args.responseMessage,
      respondedAt: Date.now(),
    });

    // Notify volunteer
    await ctx.db.insert("notifications", {
      recipientId: request.volunteerId,
      type: "PROJECT",
      title: `Your request was declined`,
      message: `${user.firstName} declined your participation request for "${project.title}"`,
      linkUrl: "/participations",
      isRead: false,
    });

    return { success: true };
  },
});

// ============================================
// Cancel Request (volunteer only)
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
    if (!request || request.volunteerId !== user._id) {
      throw new Error("Not authorized.");
    }

    await ctx.db.patch(args.requestId, { status: "CANCELLED" });
    return { success: true };
  },
});
