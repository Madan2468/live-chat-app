import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const store = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    let currentUserId;

    if (user !== null) {
      if (user.name !== args.name || user.image !== args.image) {
        await ctx.db.patch(user._id, {
          name: args.name,
          image: args.image,
        });
      }
      currentUserId = user._id;
    } else {
      currentUserId = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        name: args.name,
        email: args.email,
        image: args.image,
        isOnline: true,
      });
    }

    // Automatically join or create Global Chat
    let globalChat = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("name"), "Global Chat"))
      .first();

    let conversationId;
    if (globalChat) {
      conversationId = globalChat._id;
    } else {
      conversationId = await ctx.db.insert("conversations", {
        name: "Global Chat",
        isGroup: true,
        adminId: currentUserId,
      });
    }

    // Add to members
    const isMember = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", currentUserId)
      )
      .unique();

    if (!isMember) {
      await ctx.db.insert("conversationMembers", {
        conversationId,
        userId: currentUserId,
      });

      await ctx.db.insert("messages", {
        conversationId,
        senderId: currentUserId,
        content: `${args.name} joined the chat 🎉`,
        type: "system",
        isDeleted: false,
      });
    }

    return currentUserId;
  },
});

export const getMe = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

export const getUsers = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const users = await ctx.db.query("users").collect();
    return users.filter((u) => u.clerkId !== identity.subject);
  },
});

export const searchUsers = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const users = await ctx.db.query("users").collect();
    const lowerQuery = args.query.toLowerCase();

    return users.filter(
      (u) =>
        u.clerkId !== identity.subject &&
        (u.name.toLowerCase().includes(lowerQuery) ||
          u.email.toLowerCase().includes(lowerQuery))
    );
  },
});

export const setUserOnlineStatus = mutation({
  args: { isOnline: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (user) {
      await ctx.db.patch(user._id, { isOnline: args.isOnline });
    }
  },
});
