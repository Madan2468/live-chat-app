import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.string(),
    clerkId: v.string(),
    isOnline: v.boolean(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_name", ["name"]),

  conversations: defineTable({
    name: v.optional(v.string()), // For group chats
    isGroup: v.boolean(),
    adminId: v.optional(v.id("users")),
  }),

  conversationMembers: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    lastSeenMessageId: v.optional(v.string()), // ID of the last message seen
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_userId", ["userId"])
    .index("by_conversation_and_user", ["conversationId", "userId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    type: v.union(v.literal("text"), v.literal("image")),
    isDeleted: v.boolean(),
  })
    .index("by_conversationId", ["conversationId"]),

  reactions: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  })
    .index("by_messageId", ["messageId"]),

  typingStatus: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    lastUpdated: v.number(),
  })
    .index("by_conversation_and_user", ["conversationId", "userId"]),
});
