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

export const list = query({
  args: {
    token: v.string(),
    search: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    let users;
    if (args.search && args.search.length > 0) {
      users = await ctx.db
        .query("users")
        .withSearchIndex("search_name", (q) => q.search("firstName", args.search!))
        .collect();
    } else {
      users = await ctx.db.query("users").collect();
    }

    if (args.emailVerified !== undefined) {
      users = users.filter((u) => u.emailVerified === args.emailVerified);
    }

    return users.map((u) => ({
      _id: u._id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      profilePictureUrl: u.profilePictureUrl,
      isActive: u.isActive,
      isStaff: u.isStaff,
      emailVerified: u.emailVerified,
      averageRating: u.averageRating,
      reviewCount: u.reviewCount,
      _creationTime: u._creationTime,
      lastLoginAt: u.lastLoginAt,
    }));
  },
});

export const getDetail = query({
  args: { token: v.string(), id: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const user = await ctx.db.get(args.id);
    if (!user) return null;

    let address = null;
    if (user.addressId) {
      const addr = await ctx.db.get(user.addressId);
      if (addr) {
        let country = null;
        if (addr.countryId) country = await ctx.db.get(addr.countryId);
        address = { ...addr, country };
      }
    }

    const skills = [];
    if (user.skillIds) {
      for (const skillId of user.skillIds) {
        const skill = await ctx.db.get(skillId);
        if (skill) skills.push(skill);
      }
    }

    const languages = [];
    if (user.languageIds) {
      for (const langId of user.languageIds) {
        const lang = await ctx.db.get(langId);
        if (lang) languages.push(lang);
      }
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_receiver", (q) => q.eq("receiverId", user._id))
      .collect();

    return {
      ...user,
      legacyPasswordHash: undefined,
      address,
      skills,
      languages,
      projects: projects.map((p) => ({
        _id: p._id,
        title: p.title,
        status: p.status,
        _creationTime: p._creationTime,
      })),
      reviewsReceived: reviews
        .filter((r) => r.isPublished)
        .map((r) => ({
          _id: r._id,
          writerId: r.writerId,
          rating: r.rating,
          feedback: r.feedback,
        })),
    };
  },
});

export const block = mutation({
  args: { token: v.string(), id: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.patch(args.id, { isActive: false });
    return { success: true };
  },
});

export const unblock = mutation({
  args: { token: v.string(), id: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.patch(args.id, { isActive: true });
    return { success: true };
  },
});

export const verifyEmail = mutation({
  args: { token: v.string(), id: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.patch(args.id, { emailVerified: true });
    return { success: true };
  },
});

export const unverifyEmail = mutation({
  args: { token: v.string(), id: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.patch(args.id, { emailVerified: false });
    return { success: true };
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const target = await ctx.db.get(args.id);
    if (!target) throw new Error("User not found.");
    if (target.isStaff || target.isSuperuser) {
      throw new Error("Cannot delete staff or superuser accounts.");
    }
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// CLI utility: patch any user by email (no auth required — use from server only)
// Usage: npx convex run admin/users:patchByEmail '{"email":"x@y.com","fields":{"firstName":"New"}}'
export const patchByEmail = mutation({
  args: { email: v.string(), fields: v.any() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").withIndex("by_email", (q: any) => q.eq("email", args.email)).first();
    if (!user) throw new Error(`User ${args.email} not found`);
    await ctx.db.patch(user._id, args.fields);
    return { patched: user._id, email: args.email, fields: Object.keys(args.fields) };
  },
});
