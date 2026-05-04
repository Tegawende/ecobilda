import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getMyFavorites = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return favorites.map((f) => f.missionId);
  },
});

export const isFavorited = query({
  args: {
    userId: v.id("users"),
    missionId: v.id("missions"),
  },
  handler: async (ctx, args) => {
    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_user_mission", (q) =>
        q.eq("userId", args.userId).eq("missionId", args.missionId)
      )
      .first();
    return favorite !== null;
  },
});

export const toggle = mutation({
  args: {
    userId: v.id("users"),
    missionId: v.id("missions"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_mission", (q) =>
        q.eq("userId", args.userId).eq("missionId", args.missionId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { action: "removed" as const };
    }

    // Cannot favorite your own mission
    const mission = await ctx.db.get(args.missionId);
    if (mission && mission.ownerId === args.userId) {
      throw new Error("Cannot favorite your own mission");
    }

    await ctx.db.insert("favorites", {
      userId: args.userId,
      missionId: args.missionId,
    });
    return { action: "added" as const };
  },
});
