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

    if (user !== null) {
      if (user.name !== args.name || user.image !== args.image) {
        await ctx.db.patch(user._id, {
          name: args.name,
          image: args.image,
        });
      }
      return user._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      image: args.image,
      isOnline: true,
    });
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

    const users = await ctx.db
      .query("users")
      .withIndex("by_name", (q) =>
        q.gte("name", args.query).lte("name", args.query + "\uf8ff")
      )
      .collect();

    return users.filter((u) => u.clerkId !== identity.subject);
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
