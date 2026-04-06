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

const MAX_SAVED_SEARCHES = 5;

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return [];

    return await ctx.db
      .query("savedSearches")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const save = mutation({
  args: {
    token: v.string(),
    name: v.optional(v.string()),
    filters: v.string(), // JSON stringified
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const existing = await ctx.db
      .query("savedSearches")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (existing.length >= MAX_SAVED_SEARCHES) {
      throw new Error(`Maximum ${MAX_SAVED_SEARCHES} saved searches allowed.`);
    }

    const id = await ctx.db.insert("savedSearches", {
      userId: user._id,
      name: args.name,
      filters: args.filters,
    });
    return id;
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("savedSearches") },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const search = await ctx.db.get(args.id);
    if (!search || search.userId !== user._id) {
      throw new Error("Not authorized.");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
