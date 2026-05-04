import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

async function requireAdmin(ctx: any, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) throw new Error("Not authenticated.");
  const user = await ctx.db.get(session.userId);
  if (!user || !user.isStaff) throw new Error("Not authorized.");
  return user;
}

async function enrichProject(ctx: any, project: any) {
  const owner = await ctx.db.get(project.ownerId);
  let address: any = null;
  if (project.addressId) {
    const addr = await ctx.db.get(project.addressId);
    if (addr) {
      const country = addr.countryId ? await ctx.db.get(addr.countryId) : null;
      address = { ...addr, country };
    }
  }
  const rawImages = await ctx.db
    .query("projectImages")
    .withIndex("by_project", (q: any) => q.eq("projectId", project._id))
    .collect();
  const images = await Promise.all(
    rawImages.map(async (img: any) => ({
      ...img,
      url: img.url ?? (img.storageId ? await ctx.storage.getUrl(img.storageId) : null),
    }))
  );

  let ownerPictureUrl = owner?.profilePictureUrl ?? null;
  if (owner?.profilePicture && !ownerPictureUrl) {
    ownerPictureUrl = await ctx.storage.getUrl(owner.profilePicture);
  }

  // Mission counts (all + published)
  const missions = await ctx.db
    .query("missions")
    .withIndex("by_project", (q: any) => q.eq("projectId", project._id))
    .collect();
  const publishedMissions = missions.filter(
    (m: any) => m.status === "PUBLISHED" || m.status === "IN_PROGRESS"
  );

  return {
    ...project,
    owner: owner
      ? {
          _id: owner._id,
          email: owner.email,
          firstName: owner.firstName,
          lastName: owner.lastName,
          profilePictureUrl: ownerPictureUrl,
        }
      : null,
    address,
    images,
    missionsCount: missions.length,
    publishedMissionsCount: publishedMissions.length,
  };
}

export const getPending = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_status", (q) => q.eq("status", "PENDING"))
      .collect();
    return await Promise.all(projects.map((p) => enrichProject(ctx, p)));
  },
});

export const getValidated = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_status", (q) => q.eq("status", "ACTIVE"))
      .collect();
    return await Promise.all(projects.map((p) => enrichProject(ctx, p)));
  },
});

export const getDetail = query({
  args: { token: v.string(), id: v.id("projects") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const project = await ctx.db.get(args.id);
    if (!project) return null;
    return await enrichProject(ctx, project);
  },
});

export const validate = mutation({
  args: { token: v.string(), id: v.id("projects") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const project = await ctx.db.get(args.id);
    if (!project) throw new Error("Place not found.");

    await ctx.db.patch(args.id, {
      status: "ACTIVE",
      validatedAt: Date.now(),
      validatedBy: admin._id,
    });

    await ctx.db.insert("notifications", {
      recipientId: project.ownerId,
      type: "PROJECT",
      title: "Your place has been approved!",
      message: `Your place "${project.title}" is now approved. You can publish missions on it.`,
      linkUrl: `/my-missions`,
      isRead: false,
    });

    return { success: true };
  },
});

export const reject = mutation({
  args: { token: v.string(), id: v.id("projects"), reason: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const project = await ctx.db.get(args.id);
    if (!project) throw new Error("Place not found.");

    await ctx.db.patch(args.id, {
      status: "REJECTED",
      rejectionReason: args.reason,
      validatedAt: Date.now(),
      validatedBy: admin._id,
    });

    await ctx.db.insert("notifications", {
      recipientId: project.ownerId,
      type: "PROJECT",
      title: "Your place was not approved",
      message: `Your place "${project.title}" was not approved. Reason: ${args.reason}`,
      linkUrl: `/my-missions`,
      isRead: false,
    });

    return { success: true };
  },
});

export const invalidate = mutation({
  args: { token: v.string(), id: v.id("projects") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.patch(args.id, {
      status: "PENDING",
      validatedAt: undefined,
      validatedBy: undefined,
      rejectionReason: undefined,
    });
    return { success: true };
  },
});
