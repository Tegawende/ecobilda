import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getMyFavorites = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return favorites.map((f) => f.projectId);
  },
});

export const isFavorited = query({
  args: {
    userId: v.id("users"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", args.userId).eq("projectId", args.projectId)
      )
      .first();
    return favorite !== null;
  },
});

export const toggle = mutation({
  args: {
    userId: v.id("users"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Check if already favorited
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", args.userId).eq("projectId", args.projectId)
      )
      .first();

    if (existing) {
      // Remove favorite
      await ctx.db.delete(existing._id);
      return { action: "removed" as const };
    }

    // Check user is not favoriting their own project
    const project = await ctx.db.get(args.projectId);
    if (project && project.ownerId === args.userId) {
      throw new Error("Cannot favorite your own project");
    }

    // Add favorite
    await ctx.db.insert("favorites", {
      userId: args.userId,
      projectId: args.projectId,
    });
    return { action: "added" as const };
  },
});
