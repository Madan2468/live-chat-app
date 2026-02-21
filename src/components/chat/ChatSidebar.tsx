"use client";

import { UserButton } from "@clerk/nextjs";
import { useState } from "react";
import { Plus } from "lucide-react";
import UserSearch from "./UserSearch";
import ConversationList from "./ConversationList";
import CreateGroupModal from "./CreateGroupModal";
import ThemeToggle from "./ThemeToggle";

export default function ChatSidebar() {
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  return (
    <aside className="w-full flex flex-col h-full bg-card border-r border-border shadow-sm transition-colors duration-300">
      <div className="p-4 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground hidden sm:block">
            ChatApp
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="p-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all duration-300 group"
            title="Create Group"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
          <div className="border-l border-border pl-2 h-8 flex items-center">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-border bg-background/30">
        <UserSearch />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-background/50">
        <ConversationList />
      </div>

      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
      />
    </aside>
  );
}
