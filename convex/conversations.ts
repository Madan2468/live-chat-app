import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    participantIds: v.array(v.id("users")),
    isGroup: v.boolean(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!me) throw new Error("User not found");

    const allParticipantIds = Array.from(new Set([...args.participantIds, me._id]));

    // Check for existing 1-on-1 conversation
    if (!args.isGroup && allParticipantIds.length === 2) {
      const otherUserId = args.participantIds[0];
      const existing = await ctx.db
        .query("conversationMembers")
        .withIndex("by_userId", (q) => q.eq("userId", me._id))
        .collect();

      for (const member of existing) {
        const otherMember = await ctx.db
          .query("conversationMembers")
          .withIndex("by_conversation_and_user", (q) =>
            q.eq("conversationId", member.conversationId).eq("userId", otherUserId)
          )
          .unique();

        const conversation = await ctx.db.get(member.conversationId);
        if (otherMember && conversation && !conversation.isGroup) {
          return conversation._id;
        }
      }
    }

    const conversationId = await ctx.db.insert("conversations", {
      isGroup: args.isGroup,
      name: args.name,
      adminId: args.isGroup ? me._id : undefined,
    });

    for (const userId of allParticipantIds) {
      await ctx.db.insert("conversationMembers", {
        conversationId,
        userId,
      });
    }

    return conversationId;
  },
});

export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!me) return [];

    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_userId", (q) => q.eq("userId", me._id))
      .collect();

    const conversations = [];
    for (const membership of memberships) {
      const conversation = await ctx.db.get(membership.conversationId);
      if (!conversation) continue;

      // Get other members for 1-on-1 info or group member count
      const allMembers = await ctx.db
        .query("conversationMembers")
        .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
        .collect();

      const lastMessage = await ctx.db
        .query("messages")
        .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
        .order("desc")
        .first();

      // Get unread count: messages in this conversation created after our lastSeenMessageId
      // First, get the last seen message for this user in this conversation
      const lastSeen = membership.lastSeenMessageId;
      let unreadCount = 0;

      if (lastSeen) {
        const lastSeenMessage = await ctx.db.get(lastSeen as any);
        if (lastSeenMessage) {
          unreadCount = await ctx.db
            .query("messages")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
            .filter((q) => q.gt(q.field("_creationTime"), lastSeenMessage._creationTime))
            .collect()
            .then(msgs => msgs.filter(m => m.senderId !== me._id).length);
        }
      } else {
        // If never seen, count all messages not sent by me
        unreadCount = await ctx.db
          .query("messages")
          .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
          .collect()
          .then(msgs => msgs.filter(m => m.senderId !== me._id).length);
      }

      let otherUser = null;
      if (!conversation.isGroup) {
        const otherMember = allMembers.find((m) => m.userId !== me._id);
        if (otherMember) {
          otherUser = await ctx.db.get(otherMember.userId);
        }
      }

      conversations.push({
        ...conversation,
        otherUser,
        lastMessage,
        unreadCount,
        memberCount: allMembers.length,
      });
    }

    return conversations.sort((a, b) => {
      const timeA = a.lastMessage?._creationTime ?? a._creationTime;
      const timeB = b.lastMessage?._creationTime ?? b._creationTime;
      return timeB - timeA;
    });
  },
});

export const markAsRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!me) return;

    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", me._id)
      )
      .unique();

    if (!membership) return;

    const lastMessage = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .first();

    if (lastMessage) {
      await ctx.db.patch(membership._id, {
        lastSeenMessageId: lastMessage._id,
      });
    }
  },
});

export const deleteConversation = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!me) throw new Error("User not found");

    // Ensure the caller is a member of the conversation
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", me._id)
      )
      .unique();
    if (!membership) throw new Error("Not a member of this conversation");

    // Delete all messages and their reactions
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    for (const msg of messages) {
      const reactions = await ctx.db
        .query("reactions")
        .withIndex("by_messageId", (q) => q.eq("messageId", msg._id))
        .collect();
      for (const reaction of reactions) {
        await ctx.db.delete(reaction._id);
      }
      await ctx.db.delete(msg._id);
    }

    // Delete typing status entries
    const typingEntries = await ctx.db
      .query("typingStatus")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();
    for (const entry of typingEntries) {
      await ctx.db.delete(entry._id);
    }

    // Delete all memberships
    const members = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete the conversation itself
    await ctx.db.delete(args.conversationId);
  },
});

export const addGroupMember = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!me) throw new Error("User not found");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation?.isGroup) throw new Error("Not a group conversation");

    // Only admin can add members
    if (conversation.adminId !== me._id) throw new Error("Only the admin can add members");

    // Check the user is not already a member
    const existing = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .unique();
    if (existing) throw new Error("User is already a member");

    await ctx.db.insert("conversationMembers", {
      conversationId: args.conversationId,
      userId: args.userId,
    });

    const addedUser = await ctx.db.get(args.userId);

    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: me._id,
      content: `${addedUser?.name || "Someone"} was added by ${me.name}.`,
      type: "system",
      isDeleted: false,
    });
  },
});
