import { mutation } from "./_generated/server";
import { v } from "convex/values";

async function getUserFromToken(ctx: any, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) return null;
  return await ctx.db.get(session.userId);
}

export const create = mutation({
  args: {
    token: v.string(),
    targetType: v.string(), // "PROJECT" | "USER" | "REVIEW"
    targetId: v.string(),
    reason: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    await ctx.db.insert("reports", {
      reporterId: user._id,
      targetType: args.targetType,
      targetId: args.targetId,
      reason: args.reason,
      details: args.details,
      status: "PENDING",
    });

    return { success: true };
  },
});
