"use client";

import { ReactNode } from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import { useParams } from "next/navigation";

export default function ChatLayout({ children }: { children: ReactNode }) {
  const { conversationId } = useParams();
  const inConvo = !!conversationId;

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <div
        className="w-full md:w-80 lg:w-96 border-r border-slate-200 shrink-0 md:block hidden data-[in-convo=false]:block"
        data-in-convo={inConvo}
      >
        <ChatSidebar />
      </div>
      <main
        className="flex-1 relative overflow-hidden bg-slate-50 md:block hidden data-[in-convo=true]:block"
        data-in-convo={inConvo}
      >
        {children}
      </main>
    </div>
  );
}
