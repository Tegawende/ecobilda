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

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

// ============================================
// Get Messages (reactive - replaces WebSocket)
// ============================================

export const getByConversation = query({
  args: {
    token: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return [];

    const conv = await ctx.db.get(args.conversationId);
    if (!conv) return [];
    if (conv.user1Id !== user._id && conv.user2Id !== user._id) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    // Enrich with sender info and image URLs
    const enriched = [];
    for (const msg of messages) {
      const sender = await ctx.db.get(msg.senderId);
      let imageUrl: string | null = null;
      if (msg.imageStorageId) {
        imageUrl = await ctx.storage.getUrl(msg.imageStorageId);
      }
      enriched.push({
        ...msg,
        imageUrl,
        sender: sender
          ? {
              _id: sender._id,
              firstName: sender.firstName,
              lastName: sender.lastName,
              profilePicture: sender.profilePicture,
              profilePictureUrl: sender.profilePictureUrl,
            }
          : null,
      });
    }

    return enriched;
  },
});

// ============================================
// Send Message
// ============================================

export const send = mutation({
  args: {
    token: v.string(),
    conversationId: v.id("conversations"),
    body: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error("Conversation not found.");
    if (conv.user1Id !== user._id && conv.user2Id !== user._id) {
      throw new Error("Not a participant.");
    }

    // Create message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: user._id,
      body: args.body,
      ...(args.imageStorageId ? { imageStorageId: args.imageStorageId } : {}),
    });

    // Update conversation metadata
    const isUser1 = conv.user1Id === user._id;
    const lastMessageText = args.body.trim()
      ? args.body.slice(0, 200)
      : "[image]";
    const updates: any = {
      lastMessageText,
      lastMessageAt: Date.now(),
    };

    // Increment unread count for the OTHER user
    if (isUser1) {
      updates.unreadCountUser2 = conv.unreadCountUser2 + 1;
    } else {
      updates.unreadCountUser1 = conv.unreadCountUser1 + 1;
    }

    await ctx.db.patch(args.conversationId, updates);

    // Create in-app notification for receiver
    const receiverId = isUser1 ? conv.user2Id : conv.user1Id;
    await ctx.db.insert("notifications", {
      recipientId: receiverId,
      type: "MESSAGE",
      title: `New message from ${user.firstName}`,
      message: args.body.slice(0, 200),
      linkUrl: `/messages/${args.conversationId}`,
      isRead: false,
    });

    // ============================================
    // Anti-spam email notification (24-hour rule)
    // CRITICAL BUSINESS LOGIC - preserved from Django
    // ============================================
    const receiver = await ctx.db.get(receiverId);
    if (receiver && receiver.emailNotifications) {
      const isMuted = isUser1 ? conv.user2Muted : conv.user1Muted;
      if (!isMuted) {
        const lastEmailField = isUser1 ? "lastEmailSentToUser2" : "lastEmailSentToUser1";
        const lastEmailTime = isUser1 ? conv.lastEmailSentToUser2 : conv.lastEmailSentToUser1;

        const canSendEmail = !lastEmailTime || Date.now() - lastEmailTime > TWENTY_FOUR_HOURS;

        if (canSendEmail) {
          // Mark email as sent (update timestamp)
          await ctx.db.patch(args.conversationId, {
            [lastEmailField]: Date.now(),
          });
          // TODO: Schedule actual email sending via Convex action
          // For now, we just update the timestamp to maintain the anti-spam logic
        }
      }
    }

    return messageId;
  },
});
