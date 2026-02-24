"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNowStrict, isToday, isYesterday, format } from "date-fns";
import { Users, Hash } from "lucide-react";

type FilterTab = "all" | "groups" | "dms";

function getDateLabel(ts: number) {
  const d = new Date(ts);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

export default function ConversationList({ filter = "all" }: { filter?: FilterTab }) {
  const conversations = useQuery(api.conversations.list);
  const { conversationId } = useParams();
  const router = useRouter();

  if (conversations === undefined) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3 p-3 animate-pulse">
            <div className="h-12 w-12 bg-muted rounded-xl shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 bg-muted rounded-lg w-1/2" />
              <div className="h-2 bg-muted rounded-lg w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Apply filter
  const filtered = conversations.filter((c) => {
    if (filter === "groups") return c.isGroup;
    if (filter === "dms") return !c.isGroup;
    return true;
  });

  if (filtered.length === 0) {
    const emptyLabel =
      filter === "groups"
        ? "No group conversations"
        : filter === "dms"
          ? "No direct messages"
          : "No conversations yet";
    return (
      <div className="p-8 text-center flex flex-col items-center gap-4">
        <div className="h-16 w-16 bg-gradient-to-br from-primary/20 to-violet-500/10 rounded-2xl flex items-center justify-center shadow-inner border border-primary/10">
          {filter === "groups" ? (
            <Hash className="h-8 w-8 text-primary" />
          ) : (
            <Users className="h-8 w-8 text-primary" />
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{emptyLabel}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {filter === "groups"
              ? "Create a group with the + button"
              : filter === "dms"
                ? "Search for users to start chatting"
                : "Search for users to start chatting"}
          </p>
        </div>
      </div>
    );
  }

  // Group by date label
  const grouped: { label: string; items: typeof filtered }[] = [];
  filtered.forEach((convo) => {
    const ts = convo.lastMessage?._creationTime ?? convo._creationTime ?? Date.now();
    const label = getDateLabel(ts as number);
    const existing = grouped.find((g) => g.label === label);
    if (existing) existing.items.push(convo);
    else grouped.push({ label, items: [convo] });
  });

  return (
    <div className="py-2">
      {grouped.map(({ label, items }) => (
        <div key={label}>
          {/* Date group header */}
          <div className="px-4 py-2">
            <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
              {label}
            </span>
          </div>

          <div className="space-y-0.5 px-2">
            {items.map((convo) => {
              const isActive = convo._id === conversationId;
              const displayName = convo.isGroup ? convo.name : convo.otherUser?.name;
              const displayImage = convo.isGroup ? null : convo.otherUser?.image;

              // Build last message preview with sender prefix for groups
              let lastMsgPreview: string | null = null;
              if (convo.lastMessage) {
                if (convo.lastMessage.isDeleted) {
                  lastMsgPreview = "🚫 Message deleted";
                } else if (convo.isGroup && (convo.lastMessage as any).senderName) {
                  lastMsgPreview = `${(convo.lastMessage as any).senderName}: ${convo.lastMessage.content}`;
                } else {
                  lastMsgPreview = convo.lastMessage.content;
                }
              }

              return (
                <button
                  key={convo._id}
                  onClick={() => router.push(`/conversations/${convo._id}`)}
                  className={`w-full p-3 flex items-center gap-3 rounded-2xl transition-all duration-200 group ${isActive
                      ? "bg-gradient-to-r from-violet-600 to-rose-500 text-white shadow-lg shadow-violet-500/25 scale-[1.01]"
                      : "hover:bg-accent text-foreground hover:scale-[1.01]"
                    }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {convo.isGroup ? (
                      <div
                        className={`h-12 w-12 rounded-xl flex items-center justify-center border-2 transition-colors ${isActive
                            ? "bg-white/20 border-white/30"
                            : "bg-emerald-500/10 border-emerald-500/20"
                          }`}
                      >
                        <Hash className={`h-6 w-6 ${isActive ? "text-white" : "text-emerald-500"}`} />
                      </div>
                    ) : (
                      <>
                        <img
                          src={displayImage || ""}
                          alt={displayName || ""}
                          className={`h-12 w-12 rounded-xl border-2 object-cover transition-transform duration-300 group-hover:scale-105 ${isActive ? "border-white/40" : "border-transparent"
                            }`}
                        />
                        {convo.otherUser?.isOnline && (
                          <div
                            className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-green-500 border-2 rounded-full shadow-sm ${isActive ? "border-rose-500" : "border-background"
                              } animate-online-ring`}
                          />
                        )}
                      </>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className={`text-sm font-bold truncate ${isActive ? "text-white" : "text-foreground"}`}>
                        {displayName}
                      </h4>
                      {convo.lastMessage && (
                        <span
                          className={`text-[10px] font-semibold shrink-0 ml-1 ${isActive ? "text-white/70" : "text-muted-foreground"
                            }`}
                        >
                          {formatDistanceToNowStrict(convo.lastMessage._creationTime, { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <p
                        className={`text-xs truncate font-medium ${isActive ? "text-white/80" : "text-muted-foreground"
                          }`}
                      >
                        {lastMsgPreview ?? "No messages yet"}
                      </p>
                      {convo.unreadCount > 0 && (
                        <span
                          className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black shadow-sm shrink-0 animate-badge-pulse ${isActive ? "bg-white text-violet-600" : "bg-primary text-primary-foreground"
                            }`}
                        >
                          {convo.unreadCount > 9 ? "9+" : convo.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
