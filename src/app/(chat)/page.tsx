"use client";

import { MessageSquare } from "lucide-react";

export default function Home() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50 text-center">
      <div className="h-24 w-24 bg-indigo-100 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-100 animate-bounce">
        <MessageSquare className="h-12 w-12 text-indigo-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Welcome to ChatApp</h2>
      <p className="text-slate-500 mt-2 max-w-sm">
        Select a conversation from the sidebar or search for a user to start a new chat.
      </p>
    </div>
  );
}
