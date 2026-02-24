"use client";

import { UserButton } from "@clerk/nextjs";
import { useState } from "react";
import { Plus, Zap, Users, Hash, MessagesSquare } from "lucide-react";
import UserSearch from "./UserSearch";
import ConversationList from "./ConversationList";
import CreateGroupModal from "./CreateGroupModal";
import ThemeToggle from "./ThemeToggle";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

type FilterTab = "all" | "groups" | "dms";

const TABS: { id: FilterTab; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All", icon: MessagesSquare },
  { id: "dms", label: "DMs", icon: Users },
  { id: "groups", label: "Groups", icon: Hash },
];

export default function ChatSidebar() {
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const allUsers = useQuery(api.users.getUsers);
  const onlineCount = allUsers?.filter((u) => u.isOnline).length ?? 0;

  return (
    <aside className="w-full flex flex-col h-full bg-card border-r border-border shadow-sm transition-colors duration-300">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border sticky top-0 z-10 bg-card/80 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          {/* Animated Logo Icon */}
          <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 overflow-hidden group">
            <div className="absolute inset-0 animate-shimmer opacity-60" />
            <Zap className="h-5 w-5 text-white drop-shadow-md relative z-10" />
          </div>
          <div className="hidden sm:flex flex-col">
            <h1 className="text-lg font-black tracking-tight gradient-text leading-none">
              ChatApp
            </h1>
            {/* Online count badge */}
            <div className="flex items-center gap-1 mt-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {onlineCount} online
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="p-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all duration-300 group border border-primary/20 hover:border-primary/40"
            title="Create Group"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
          <div className="border-l border-border pl-2 h-8 flex items-center">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border bg-background/20">
        <UserSearch />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-3 py-2.5 border-b border-border bg-card/50">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeFilter === id;
          return (
            <button
              key={id}
              onClick={() => setActiveFilter(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${isActive
                  ? "bg-primary/15 text-primary border border-primary/25 shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <ConversationList filter={activeFilter} />
      </div>

      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
      />
    </aside>
  );
}
