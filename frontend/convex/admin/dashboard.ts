import { query } from "../_generated/server";
import { v } from "convex/values";

async function requireAdmin(ctx: any, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) throw new Error("Not authenticated.");
  const user = await ctx.db.get(session.userId);
  if (!user || !user.isStaff) throw new Error("Not authorized.");
  return user;
}

export const getStats = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const users = await ctx.db.query("users").collect();
    const projects = await ctx.db.query("projects").collect();
    const reviews = await ctx.db.query("reviews").collect();
    const messages = await ctx.db.query("messages").collect();
    const favorites = await ctx.db.query("favorites").collect();
    const reports = await ctx.db.query("reports").collect();
    const participations = await ctx.db.query("participationRequests").collect();

    const newUsersThisMonth = users.filter((u) => u._creationTime > thirtyDaysAgo).length;
    const newProjectsThisMonth = projects.filter((p) => p._creationTime > thirtyDaysAgo).length;

    const publishedReviews = reviews.filter((r) => r.isPublished);
    const avgRating =
      publishedReviews.length > 0
        ? publishedReviews.reduce((sum, r) => sum + r.rating, 0) / publishedReviews.length
        : 0;

    return {
      users: {
        total: users.length,
        newThisMonth: newUsersThisMonth,
        withProjects: new Set(projects.map((p) => p.ownerId.toString())).size,
      },
      projects: {
        total: projects.length,
        active: projects.filter((p) => p.status === "ACTIVE").length,
        pending: projects.filter((p) => p.status === "PENDING").length,
        rejected: projects.filter((p) => p.status === "REJECTED").length,
        newThisMonth: newProjectsThisMonth,
      },
      participations: {
        total: participations.length,
        pending: participations.filter((p) => p.status === "PENDING").length,
        accepted: participations.filter((p) => p.status === "ACCEPTED").length,
        refused: participations.filter((p) => p.status === "REFUSED").length,
      },
      reviews: {
        total: publishedReviews.length,
        averageRating: Math.round(avgRating * 10) / 10,
      },
      reports: {
        total: reports.length,
        pending: reports.filter((r) => r.status === "PENDING").length,
      },
      messages: { total: messages.length },
      favorites: { total: favorites.length },
    };
  },
});
