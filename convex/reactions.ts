import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const toggle = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!me) throw new Error("User not found");

    const existing = await ctx.db
      .query("reactions")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .filter((q) => q.and(q.eq(q.field("userId"), me._id), q.eq(q.field("emoji"), args.emoji)))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    } else {
      await ctx.db.insert("reactions", {
        messageId: args.messageId,
        userId: me._id,
        emoji: args.emoji,
      });
    }
  },
});
