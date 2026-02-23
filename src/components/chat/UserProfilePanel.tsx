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

/** Derive a deterministic gradient from the user's name */
function nameToGradient(name?: string): string {
  const gradients = [
    "from-violet-500 to-indigo-600",
    "from-rose-500 to-pink-600",
    "from-amber-400 to-orange-500",
    "from-emerald-400 to-teal-600",
    "from-cyan-400 to-blue-600",
    "from-fuchsia-500 to-purple-700",
  ];
  if (!name) return gradients[0];
  const idx = name.charCodeAt(0) % gradients.length;
  return gradients[idx];
}

export default function UserProfilePanel({ user, isOpen, onClose, onMessageClick }: UserProfilePanelProps) {
  if (!user) return null;

  const gradient = nameToGradient(user.name);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Slide-in Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-80 z-50 bg-card border-l border-border shadow-2xl flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Gradient Cover */}
        <div className={`relative h-32 bg-gradient-to-br ${gradient} overflow-hidden shrink-0`}>
          {/* Shimmering overlay */}
          <div className="absolute inset-0 animate-shimmer opacity-40" />
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-black/20 hover:bg-black/40 text-white transition-all hover:rotate-90 duration-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Avatar overlapping the cover */}
        <div className="relative px-6 pb-4 shrink-0">
          <div className="absolute -top-10 left-6">
            <div className="relative">
              <img
                src={user.image || ""}
                alt={user.name || "User"}
                className="h-20 w-20 rounded-2xl border-4 border-card shadow-xl object-cover"
              />
              {user.isOnline && (
                <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 border-3 border-card rounded-full animate-online-ring" />
              )}
            </div>
          </div>
          {/* Push text below avatar */}
          <div className="mt-12">
            <h2 className="text-xl font-black text-foreground tracking-tight">{user.name}</h2>
            <span
              className={`inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-[11px] font-bold border ${user.isOnline
                  ? "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400"
                  : "bg-muted text-muted-foreground border-border"
                }`}
            >
              <Circle
                className={`h-2 w-2 fill-current ${user.isOnline ? "text-green-500 animate-pulse" : "text-muted-foreground/40"
                  }`}
              />
              {user.isOnline ? "Active now" : "Offline"}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border mx-6" />

        {/* Info section */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
              Email
            </p>
            <div className="flex items-center gap-3 p-3.5 bg-accent/50 rounded-2xl border border-border/60">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-semibold text-foreground truncate">
                {user.email || "No email"}
              </span>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
              Status
            </p>
            <div className="flex items-center gap-3 p-3.5 bg-accent/50 rounded-2xl border border-border/60">
              <div
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${user.isOnline ? "bg-green-500 animate-pulse" : "bg-muted-foreground/30"
                  }`}
              />
              <span
                className={`text-sm font-semibold ${user.isOnline ? "text-green-500 dark:text-green-400" : "text-muted-foreground"
                  }`}
              >
                {user.isOnline ? "Active right now" : "Currently offline"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        {onMessageClick && (
          <div className="p-5 border-t border-border bg-card/80 backdrop-blur-xl shrink-0">
            <button
              onClick={() => { onMessageClick(); onClose(); }}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-rose-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-violet-500/20 group"
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
