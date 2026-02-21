import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const threshold = Date.now() - 5000;
    const statuses = await ctx.db
      .query("typingStatus")
      .withIndex("by_conversation_and_user", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.gt(q.field("lastUpdated"), threshold))
      .collect();

    const users = [];
    for (const status of statuses) {
      const user = await ctx.db.get(status.userId);
      if (user) users.push(user);
    }
    return users;
  },
});

export const update = mutation({
  args: {
    conversationId: v.id("conversations"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return;

    const existing = await ctx.db
      .query("typingStatus")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", user._id)
      )
      .unique();

    if (args.isTyping) {
      if (existing) {
        await ctx.db.patch(existing._id, { lastUpdated: Date.now() });
      } else {
        await ctx.db.insert("typingStatus", {
          conversationId: args.conversationId,
          userId: user._id,
          lastUpdated: Date.now(),
        });
      }
    } else {
      if (existing) {
        await ctx.db.delete(existing._id);
      }
    }
  },
});
