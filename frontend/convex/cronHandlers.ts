import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  FEEDBACK_NOTIFY_DELAY_MS,
  FEEDBACK_REMINDER_DELAY_MS,
  FEEDBACK_DEADLINE_MS,
} from "./lib/missionConstants";

const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

// ============================================
// Expire old pending participation requests
// ============================================

export const expireParticipationRequests = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - FOURTEEN_DAYS;
    const pending = await ctx.db.query("participationRequests").collect();

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
// Auto-publish reviews after 30-day deadline (Airbnb-style)
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

// ============================================
// Mission lifecycle — runs daily.
// Transitions:
//   PUBLISHED + startDate <= now           → IN_PROGRESS
//   IN_PROGRESS + endDate + 24h <= now     → COMPLETED + feedback notif
//   COMPLETED  + 3 days since notified
//                + no reminder yet
//                + no feedback              → reminder
// ============================================

export const processMissionLifecycle = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const missions = await ctx.db.query("missions").collect();

    let started = 0;
    let completed = 0;
    let reminded = 0;

    for (const mission of missions) {
      // PUBLISHED → IN_PROGRESS
      if (mission.status === "PUBLISHED") {
        const startMs = new Date(mission.startDate).getTime();
        if (!isNaN(startMs) && startMs <= now) {
          await ctx.db.patch(mission._id, { status: "IN_PROGRESS", updatedAt: now });
          started++;
        }
      }

      // IN_PROGRESS → COMPLETED (24h after endDate)
      if (mission.status === "IN_PROGRESS") {
        const endMs = new Date(mission.endDate).getTime();
        if (!isNaN(endMs) && endMs + FEEDBACK_NOTIFY_DELAY_MS <= now && !mission.feedbackNotifiedAt) {
          const accepted = await ctx.db
            .query("participationRequests")
            .withIndex("by_mission_status", (q) =>
              q.eq("missionId", mission._id).eq("status", "ACCEPTED")
            )
            .collect();

          await ctx.db.patch(mission._id, {
            status: "COMPLETED",
            feedbackNotifiedAt: now,
            feedbackDeadlineAt: now + FEEDBACK_DEADLINE_MS,
            updatedAt: now,
          });

          // Notify host
          await ctx.db.insert("notifications", {
            recipientId: mission.ownerId,
            type: "MISSION",
            title: `Mission completed: ${mission.title}`,
            message:
              "Your mission is now complete. Share a feedback to help others learn from your experience.",
            linkUrl: `/missions/${mission._id}/feedback`,
            isRead: false,
          });

          // Notify accepted helpers (so they can leave a review)
          for (const req of accepted) {
            await ctx.db.insert("notifications", {
              recipientId: req.volunteerId,
              type: "MISSION",
              title: `Mission completed: ${mission.title}`,
              message:
                "Your mission ended. Share a review of the host and upload photos if you wish.",
              linkUrl: `/missions/${mission._id}`,
              isRead: false,
            });
          }

          // Schedule emails (best-effort)
          try {
            const host = await ctx.db.get(mission.ownerId);
            if (host && host.emailNotifications) {
              await ctx.scheduler.runAfter(
                0,
                internal.emails.sendMissionCompletedEmail,
                {
                  to: host.email,
                  recipientName: `${host.firstName}`,
                  missionTitle: mission.title,
                  missionId: mission._id,
                  isHost: true,
                  locale: host.notificationLanguage || "en",
                }
              );
            }
            for (const req of accepted) {
              const helper = await ctx.db.get(req.volunteerId);
              if (helper && helper.emailNotifications) {
                await ctx.scheduler.runAfter(
                  0,
                  internal.emails.sendMissionCompletedEmail,
                  {
                    to: helper.email,
                    recipientName: helper.firstName,
                    missionTitle: mission.title,
                    missionId: mission._id,
                    isHost: false,
                    locale: helper.notificationLanguage || "en",
                  }
                );
              }
            }
          } catch (e) {
            console.error("Failed to schedule completion emails", e);
          }

          completed++;
        }
      }

      // COMPLETED + 3 days + no reminder + no feedback → remind
      if (
        mission.status === "COMPLETED" &&
        mission.feedbackNotifiedAt &&
        !mission.feedbackReminderSentAt &&
        mission.feedbackNotifiedAt + FEEDBACK_REMINDER_DELAY_MS <= now
      ) {
        const existingFeedback = await ctx.db
          .query("missionFeedback")
          .withIndex("by_mission", (q) => q.eq("missionId", mission._id))
          .first();
        if (!existingFeedback) {
          await ctx.db.patch(mission._id, { feedbackReminderSentAt: now });

          await ctx.db.insert("notifications", {
            recipientId: mission.ownerId,
            type: "MISSION",
            title: `Don't forget your mission feedback`,
            message: `Share your experience for "${mission.title}" — it helps others learn.`,
            linkUrl: `/missions/${mission._id}/feedback`,
            isRead: false,
          });

          try {
            const host = await ctx.db.get(mission.ownerId);
            if (host && host.emailNotifications) {
              await ctx.scheduler.runAfter(
                0,
                internal.emails.sendMissionFeedbackDueEmail,
                {
                  to: host.email,
                  recipientName: host.firstName,
                  missionTitle: mission.title,
                  missionId: mission._id,
                  locale: host.notificationLanguage || "en",
                }
              );
            }
          } catch (e) {
            console.error("Failed to schedule reminder email", e);
          }

          reminded++;
        }
      }
    }

    return { started, completed, reminded };
  },
});
