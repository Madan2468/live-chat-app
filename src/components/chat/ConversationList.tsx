"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { Users, Hash } from "lucide-react";

export default function ConversationList() {
  const conversations = useQuery(api.conversations.list);
  const { conversationId } = useParams();
  const router = useRouter();

  if (conversations === undefined) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-12 w-12 bg-muted rounded-xl" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-2 bg-muted rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <p className="text-sm font-bold text-foreground">No conversations yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Search for users to start chatting
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-3">
      {conversations.map((convo) => {
        const isActive = convo._id === conversationId;
        const displayName = convo.isGroup ? convo.name : convo.otherUser?.name;
        const displayImage = convo.isGroup ? null : convo.otherUser?.image;

        return (
          <button
            key={convo._id}
            onClick={() => router.push(`/conversations/${convo._id}`)}
            className={`w-full p-3 flex items-center gap-3 rounded-2xl transition-all duration-200 group ${isActive
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
              : "hover:bg-accent text-foreground"
              }`}
          >
            <div className="relative shrink-0">
              {convo.isGroup ? (
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center border-2 transition-colors ${isActive ? "bg-white/20 border-white/30" : "bg-emerald-500/10 border-emerald-500/20"
                  }`}>
                  <Hash className={`h-6 w-6 ${isActive ? "text-white" : "text-emerald-500"}`} />
                </div>
              ) : (
                <>
                  <img
                    src={displayImage || ""}
                    alt={displayName || ""}
                    className={`h-12 w-12 rounded-xl border-2 transition-transform duration-300 group-hover:scale-105 ${isActive ? "border-white/40" : "border-transparent"
                      }`}
                  />
                  {convo.otherUser?.isOnline && (
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-background rounded-full shadow-sm" />
                  )}
                </>
              )}
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="flex justify-between items-baseline mb-0.5">
                <h4 className={`text-sm font-bold truncate ${isActive ? "text-white" : "text-foreground"}`}>
                  {displayName}
                </h4>
                {convo.lastMessage && (
                  <span className={`text-[10px] font-medium ${isActive ? "text-white/70" : "text-muted-foreground"}`}>
                    {formatDistanceToNowStrict(convo.lastMessage._creationTime, {
                      addSuffix: false,
                    })}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center gap-2">
                <p className={`text-xs truncate font-medium ${isActive ? "text-white/80" : "text-muted-foreground"}`}>
                  {convo.lastMessage ? (
                    convo.lastMessage.isDeleted ? (
                      <span className="italic opacity-60">Message deleted</span>
                    ) : (
                      convo.lastMessage.content
                    )
                  ) : (
                    "No messages"
                  )}
                </p>
                {convo.unreadCount > 0 && (
                  <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold shadow-sm ${isActive ? "bg-white text-primary" : "bg-primary text-primary-foreground"
                    }`}>
                    {convo.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
