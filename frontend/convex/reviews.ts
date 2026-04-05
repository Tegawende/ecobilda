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

const ONE_HUNDRED_EIGHTY_DAYS = 180 * 24 * 60 * 60 * 1000;

// Enrich review with user data
async function enrichReview(ctx: any, review: any) {
  const writer = await ctx.db.get(review.writerId);
  const receiver = await ctx.db.get(review.receiverId);

  return {
    ...review,
    writer: writer
      ? {
          _id: writer._id,
          firstName: writer.firstName,
          lastName: writer.lastName,
          profilePicture: writer.profilePicture,
          profilePictureUrl: writer.profilePictureUrl,
        }
      : null,
    receiver: receiver
      ? {
          _id: receiver._id,
          firstName: receiver.firstName,
          lastName: receiver.lastName,
          profilePicture: receiver.profilePicture,
          profilePictureUrl: receiver.profilePictureUrl,
        }
      : null,
  };
}

// ============================================
// Check Review Eligibility (180-day rule)
// CRITICAL BUSINESS LOGIC - preserved from Django
// Both users must have sent >= 1 message in the last 180 days
// ============================================

export const checkEligibility = query({
  args: { token: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token);
    if (!currentUser) return { eligible: false, reason: "Not authenticated." };

    if (currentUser._id === args.userId) {
      return { eligible: false, reason: "Cannot review yourself." };
    }

    // Check if already reviewed
    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("by_writer_receiver", (q) =>
        q.eq("writerId", currentUser._id).eq("receiverId", args.userId)
      )
      .first();
    if (existingReview) {
      return { eligible: false, reason: "You have already reviewed this user." };
    }

    // Find conversation between the two users
    const asUser1 = await ctx.db
      .query("conversations")
      .withIndex("by_user1", (q) => q.eq("user1Id", currentUser._id))
      .collect();
    const asUser2 = await ctx.db
      .query("conversations")
      .withIndex("by_user2", (q) => q.eq("user2Id", currentUser._id))
      .collect();

    const conversation = [...asUser1, ...asUser2].find(
      (c) =>
        (c.user1Id === currentUser._id && c.user2Id === args.userId) ||
        (c.user2Id === currentUser._id && c.user1Id === args.userId)
    );

    if (!conversation) {
      return { eligible: false, reason: "No conversation found with this user." };
    }

    // Check messages in last 180 days
    const cutoff = Date.now() - ONE_HUNDRED_EIGHTY_DAYS;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
      .collect();

    const recentMessages = messages.filter((m) => m._creationTime > cutoff);
    const currentUserSent = recentMessages.some((m) => m.senderId === currentUser._id);
    const otherUserSent = recentMessages.some((m) => m.senderId === args.userId);

    if (!currentUserSent || !otherUserSent) {
      return {
        eligible: false,
        reason: "Both users must have exchanged messages in the last 180 days.",
      };
    }

    return { eligible: true, reason: null };
  },
});

// ============================================
// Get Reviews for a User
// ============================================

export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_receiver", (q) => q.eq("receiverId", args.userId))
      .collect();

    // Only return published reviews
    const published = reviews.filter((r) => r.isPublished);

    const enriched = [];
    for (const r of published) {
      enriched.push(await enrichReview(ctx, r));
    }
    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// ============================================
// Get Reviews Written by User
// ============================================

export const getWrittenByUser = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return [];

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_writer", (q) => q.eq("writerId", user._id))
      .collect();

    const enriched = [];
    for (const r of reviews) {
      enriched.push(await enrichReview(ctx, r));
    }
    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// ============================================
// Create Review
// ============================================

export const create = mutation({
  args: {
    token: v.string(),
    receiverId: v.id("users"),
    rating: v.number(),
    feedback: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5.");
    }

    // Check for existing review
    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_writer_receiver", (q) =>
        q.eq("writerId", user._id).eq("receiverId", args.receiverId)
      )
      .first();
    if (existing) throw new Error("You have already reviewed this user.");

    // Check if reverse review exists (Airbnb-style publication)
    const reverseReview = await ctx.db
      .query("reviews")
      .withIndex("by_writer_receiver", (q) =>
        q.eq("writerId", args.receiverId).eq("receiverId", user._id)
      )
      .first();

    // Published if both reviews now exist
    const isPublished = !!reverseReview;

    const reviewId = await ctx.db.insert("reviews", {
      writerId: user._id,
      receiverId: args.receiverId,
      rating: args.rating,
      feedback: args.feedback,
      isPublished,
    });

    // If reverse review exists, publish it too
    if (reverseReview && !reverseReview.isPublished) {
      await ctx.db.patch(reverseReview._id, { isPublished: true });
    }

    // Update receiver's cached rating stats
    const allReviews = await ctx.db
      .query("reviews")
      .withIndex("by_receiver", (q) => q.eq("receiverId", args.receiverId))
      .collect();
    const publishedReviews = allReviews.filter((r) => r.isPublished);
    const avgRating =
      publishedReviews.length > 0
        ? publishedReviews.reduce((sum, r) => sum + r.rating, 0) / publishedReviews.length
        : 0;
    await ctx.db.patch(args.receiverId, {
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount: publishedReviews.length,
    });

    // Create notification
    await ctx.db.insert("notifications", {
      recipientId: args.receiverId,
      type: "REVIEW",
      title: `New review from ${user.firstName}`,
      message: `${args.rating}/5 - ${args.feedback.slice(0, 200)}`,
      linkUrl: "/profile",
      isRead: false,
    });

    return reviewId;
  },
});

// ============================================
// Add Response to Review
// ============================================

export const addResponse = mutation({
  args: {
    token: v.string(),
    reviewId: v.id("reviews"),
    response: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("Review not found.");
    if (review.receiverId !== user._id) {
      throw new Error("Only the review receiver can respond.");
    }
    if (review.response) {
      throw new Error("Response already added.");
    }

    await ctx.db.patch(args.reviewId, {
      response: args.response,
      responseDate: Date.now(),
    });

    // Notify writer
    await ctx.db.insert("notifications", {
      recipientId: review.writerId,
      type: "REVIEW",
      title: `${user.firstName} responded to your review`,
      message: args.response.slice(0, 200),
      linkUrl: `/users/${user._id}`,
      isRead: false,
    });

    return { success: true };
  },
});

// ============================================
// Delete Review
// ============================================

export const remove = mutation({
  args: { token: v.string(), reviewId: v.id("reviews") },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("Review not found.");
    if (review.writerId !== user._id) throw new Error("Not authorized.");
    if (review.response) throw new Error("Cannot delete a review with a response.");

    await ctx.db.delete(args.reviewId);

    // Update receiver's cached rating stats
    const remainingReviews = await ctx.db
      .query("reviews")
      .withIndex("by_receiver", (q) => q.eq("receiverId", review.receiverId))
      .collect();
    const published = remainingReviews.filter((r) => r.isPublished);
    const avgRating =
      published.length > 0
        ? published.reduce((sum, r) => sum + r.rating, 0) / published.length
        : 0;
    await ctx.db.patch(review.receiverId, {
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount: published.length,
    });

    return { success: true };
  },
});
