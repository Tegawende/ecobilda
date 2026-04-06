import { query, mutation } from "../_generated/server";
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

export const list = query({
  args: { token: v.string(), status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    let reports;
    if (args.status) {
      reports = await ctx.db
        .query("reports")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      reports = await ctx.db.query("reports").collect();
    }

    const enriched = [];
    for (const r of reports) {
      const reporter = await ctx.db.get(r.reporterId);
      enriched.push({
        ...r,
        reporterEmail: reporter?.email,
        reporterName: reporter ? `${reporter.firstName} ${reporter.lastName}` : "Unknown",
      });
    }

    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getPending = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_status", (q) => q.eq("status", "PENDING"))
      .collect();

    const enriched = [];
    for (const r of reports) {
      const reporter = await ctx.db.get(r.reporterId);
      enriched.push({
        ...r,
        reporterEmail: reporter?.email,
        reporterName: reporter ? `${reporter.firstName} ${reporter.lastName}` : "Unknown",
      });
    }
    return enriched;
  },
});

export const resolve = mutation({
  args: {
    token: v.string(),
    id: v.id("reports"),
    status: v.string(), // "RESOLVED" | "DISMISSED"
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    await ctx.db.patch(args.id, {
      status: args.status,
      resolvedBy: admin._id,
      resolvedAt: Date.now(),
      resolutionNotes: args.notes,
    });
    return { success: true };
  },
});
