import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Auto-expire pending participation requests older than 14 days
crons.daily(
  "expire-participation-requests",
  { hourUTC: 3, minuteUTC: 0 },
  internal.cronHandlers.expireParticipationRequests
);

// Auto-publish reviews after 30-day deadline (Airbnb-style)
crons.daily(
  "auto-publish-reviews",
  { hourUTC: 4, minuteUTC: 0 },
  internal.cronHandlers.autoPublishReviews
);

// Clean up expired sessions
crons.daily(
  "cleanup-sessions",
  { hourUTC: 5, minuteUTC: 0 },
  internal.cronHandlers.cleanupSessions
);

// Mission lifecycle: PUBLISHED → IN_PROGRESS → COMPLETED + feedback reminders
crons.daily(
  "mission-lifecycle",
  { hourUTC: 6, minuteUTC: 0 },
  internal.cronHandlers.processMissionLifecycle
);

export default crons;
