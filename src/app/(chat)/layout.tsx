"use client";

import { ReactNode } from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import { useParams } from "next/navigation";

export default function ChatLayout({ children }: { children: ReactNode }) {
  const { conversationId } = useParams();
  const inConvo = !!conversationId;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — full width on mobile when NOT in a conversation, fixed width on md+ always visible */}
      <div
        className={`
          shrink-0 border-r border-border bg-card
          w-full md:w-80 lg:w-96
          ${inConvo ? "hidden md:flex md:flex-col" : "flex flex-col"}
        `}
      >
        <ChatSidebar />
      </div>

      {/* Chat area — full width on mobile when IN a conversation, flex-1 on md+ always visible */}
      <main
        className={`
          flex-1 relative overflow-hidden bg-background
          ${inConvo ? "flex flex-col" : "hidden md:flex md:flex-col"}
        `}
      >
        {children}
      </main>
    </div>
  );
}
