import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

async function requireAdmin(ctx: any, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) throw new Error("Unauthorized");
  const user = await ctx.db.get(session.userId);
  if (!user || (!user.isStaff && !user.isSuperuser)) throw new Error("Forbidden");
  return user;
}

export const list = query({
  args: {
    token: v.string(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const messages = await ctx.db.query("contactMessages").order("desc").collect();

    if (args.status) {
      return messages.filter((m) => (m.status ?? "new") === args.status);
    }

    return messages;
  },
});

export const unreadCount = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const messages = await ctx.db.query("contactMessages").collect();
    return messages.filter((m) => !m.status || m.status === "new").length;
  },
});

export const markAsRead = mutation({
  args: {
    token: v.string(),
    id: v.id("contactMessages"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.patch(args.id, { status: "read" });
  },
});

export const markAsResolved = mutation({
  args: {
    token: v.string(),
    id: v.id("contactMessages"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.patch(args.id, { status: "resolved" });
  },
});
