"use client";

import { X, MessageCircle, Mail, Circle } from "lucide-react";

type UserProfilePanelProps = {
  user: {
    name?: string;
    email?: string;
    image?: string;
    isOnline?: boolean;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onMessageClick?: () => void;
};

export default function UserProfilePanel({ user, isOpen, onClose, onMessageClick }: UserProfilePanelProps) {
  if (!user) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-80 z-50 bg-card border-l border-border shadow-2xl flex flex-col transition-transform duration-500 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-card/50 backdrop-blur-xl">
          <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">User Info</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-xl transition-all hover:rotate-90 duration-300"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto customscrollbar">
          {/* Avatar Section */}
          <div className="flex flex-col items-center pt-12 pb-8 px-6 border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
            <div className="relative mb-4">
              <img
                src={user.image || ""}
                alt={user.name || "User"}
                className="h-28 w-28 rounded-3xl border-4 border-border shadow-2xl shadow-primary/10"
              />
              {/* Online indicator */}
              <div className={`absolute -bottom-2 -right-2 flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-card text-xs font-black shadow-lg ${user.isOnline
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
                }`}>
                <Circle className={`h-2 w-2 fill-current ${user.isOnline ? "text-white" : "text-muted-foreground"}`} />
                {user.isOnline ? "Online" : "Offline"}
              </div>
            </div>

            <h2 className="text-2xl font-black text-foreground tracking-tight text-center mt-3">
              {user.name}
            </h2>
          </div>

          {/* Info Section */}
          <div className="p-6 space-y-4">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Email</p>
              <div className="flex items-center gap-3 p-3.5 bg-accent/50 rounded-2xl">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-semibold text-foreground truncate">{user.email || "No email"}</span>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Status</p>
              <div className="flex items-center gap-3 p-3.5 bg-accent/50 rounded-2xl">
                <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${user.isOnline ? "bg-green-500 animate-pulse" : "bg-muted-foreground/30"}`} />
                <span className={`text-sm font-semibold ${user.isOnline ? "text-green-500" : "text-muted-foreground"}`}>
                  {user.isOnline ? "Active right now" : "Currently offline"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        {onMessageClick && (
          <div className="p-5 border-t border-border bg-card/50 backdrop-blur-xl">
            <button
              onClick={() => { onMessageClick(); onClose(); }}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-primary/90 transition-all active:scale-95 shadow-xl shadow-primary/20 group"
            >
              <MessageCircle className="h-5 w-5 group-hover:scale-125 transition-transform" />
              Send Message
            </button>
          </div>
        )}
      </div>
    </>
  );
}
