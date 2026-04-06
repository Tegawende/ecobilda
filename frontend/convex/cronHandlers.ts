import { internalMutation } from "./_generated/server";

const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

// ============================================
// Expire old pending participation requests
// ============================================

export const expireParticipationRequests = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - FOURTEEN_DAYS;
    const pending = await ctx.db
      .query("participationRequests")
      .collect();

    let count = 0;
    for (const request of pending) {
      if (request.status === "PENDING" && request._creationTime < cutoff) {
        await ctx.db.patch(request._id, { status: "EXPIRED" });
        count++;
      }
    }
    return { expired: count };
  },
});

// ============================================
// Auto-publish reviews after 30-day deadline
// Airbnb-style: if only one review exists after 30 days, publish it
// ============================================

export const autoPublishReviews = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - THIRTY_DAYS;
    const reviews = await ctx.db.query("reviews").collect();

    let published = 0;
    for (const review of reviews) {
      if (!review.isPublished && review._creationTime < cutoff) {
        await ctx.db.patch(review._id, { isPublished: true });
        published++;

        // Update receiver's cached rating stats
        const allReviews = await ctx.db
          .query("reviews")
          .withIndex("by_receiver", (q) => q.eq("receiverId", review.receiverId))
          .collect();
        const publishedReviews = allReviews.filter((r) => r.isPublished);
        const avgRating =
          publishedReviews.length > 0
            ? publishedReviews.reduce((sum, r) => sum + r.rating, 0) / publishedReviews.length
            : 0;
        await ctx.db.patch(review.receiverId, {
          averageRating: Math.round(avgRating * 10) / 10,
          reviewCount: publishedReviews.length,
        });
      }
    }
    return { published };
  },
});

// ============================================
// Clean up expired sessions
// ============================================

export const cleanupSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query("sessions").collect();
    let cleaned = 0;
    for (const session of sessions) {
      if (session.expiresAt < Date.now()) {
        await ctx.db.delete(session._id);
        cleaned++;
      }
    }
    return { cleaned };
  },
});
