import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    type: v.union(v.literal("text"), v.literal("image")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!me) throw new Error("User not found");

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: me._id,
      content: args.content,
      type: args.type,
      isDeleted: false,
    });

    return messageId;
  },
});

export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    const result = [];
    for (const message of messages) {
      const sender = await ctx.db.get(message.senderId);
      const reactions = await ctx.db
        .query("reactions")
        .withIndex("by_messageId", (q) => q.eq("messageId", message._id))
        .collect();

      result.push({
        ...message,
        sender,
        reactions,
      });
    }

    return result;
  },
});

export const remove = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!me || message.senderId !== me._id) {
      throw new Error("Unauthorized to delete this message");
    }

    await ctx.db.patch(args.messageId, {
      isDeleted: true,
      content: "This message was deleted",
    });
  },
});
