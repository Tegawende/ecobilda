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
// List Notifications (reactive)
// ============================================

export const listForUser = query({
  args: {
    token: v.string(),
    unreadOnly: v.optional(v.boolean()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return [];

    let notifications;

    if (args.unreadOnly) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_recipient_unread", (q) =>
          q.eq("recipientId", user._id).eq("isRead", false)
        )
        .collect();
    } else {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_recipient", (q) => q.eq("recipientId", user._id))
        .collect();
    }

    if (args.type) {
      notifications = notifications.filter((n) => n.type === args.type);
    }

    return notifications.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// ============================================
// Unread Count (reactive)
// ============================================

export const getUnreadCount = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return 0;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_unread", (q) =>
        q.eq("recipientId", user._id).eq("isRead", false)
      )
      .collect();

    return unread.length;
  },
});

// ============================================
// Mark as Read
// ============================================

export const markAsRead = mutation({
  args: { token: v.string(), id: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const notification = await ctx.db.get(args.id);
    if (!notification || notification.recipientId !== user._id) {
      throw new Error("Not found.");
    }

    await ctx.db.patch(args.id, { isRead: true, readAt: Date.now() });
    return { success: true };
  },
});

// ============================================
// Mark All as Read
// ============================================

export const markAllAsRead = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_unread", (q) =>
        q.eq("recipientId", user._id).eq("isRead", false)
      )
      .collect();

    const now = Date.now();
    for (const n of unread) {
      await ctx.db.patch(n._id, { isRead: true, readAt: now });
    }
    return { count: unread.length };
  },
});
