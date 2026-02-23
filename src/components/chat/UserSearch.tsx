"use client";

import { useState } from "react";
import { Search, Loader2, UserPlus, X } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const searchResults = useQuery(api.users.searchUsers, { query });
  const allUsers = useQuery(api.users.getUsers);
  const createConversation = useMutation(api.conversations.create);
  const router = useRouter();

  const handleCreateChat = async (userId: any) => {
    try {
      const conversationId = await createConversation({
        participantIds: [userId],
        isGroup: false,
      });
      router.push(`/conversations/${conversationId}`);
      setQuery("");
      setFocused(false);
    } catch (error) {
      console.error("Failed to create conversation", error);
    }
  };

  const displayUsers = query ? searchResults : focused ? allUsers : null;
  const isLoading = displayUsers === undefined;
  const showDropdown = focused || !!query;

  return (
    <div className="relative">
      {/* Search Input */}
      <div className={`relative transition-all duration-300 ${focused ? "drop-shadow-[0_0_12px_rgba(99,102,241,0.25)]" : ""}`}>
        <Search
          className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-all duration-300 ${focused ? "text-primary scale-110" : "text-muted-foreground"
            }`}
        />
        <input
          type="text"
          placeholder="Search users…"
          className={`w-full pl-10 pr-9 py-2.5 bg-accent/60 border-2 rounded-xl text-sm font-medium transition-all duration-300 outline-none placeholder:text-muted-foreground/50 ${focused
              ? "border-primary/40 bg-background ring-4 ring-primary/10"
              : "border-transparent hover:border-border"
            }`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-accent text-muted-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-72 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !displayUsers || displayUsers.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm font-bold text-foreground">
                  {query ? `No results for "${query}"` : "No other users yet"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Try a different name</p>
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {displayUsers.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleCreateChat(user._id)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-accent rounded-xl transition-all duration-200 text-left group"
                  >
                    {/* Avatar with online ring */}
                    <div className="relative shrink-0">
                      <img
                        src={user.image}
                        alt={user.name}
                        className={`h-10 w-10 rounded-xl border-2 object-cover group-hover:scale-105 transition-transform ${user.isOnline ? "border-green-400/60" : "border-border"
                          }`}
                      />
                      {user.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-card rounded-full animate-online-ring" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`h-1.5 w-1.5 rounded-full ${user.isOnline ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                        <p className="text-[11px] text-muted-foreground font-semibold">
                          {user.isOnline ? "Online" : user.email}
                        </p>
                      </div>
                    </div>

                    <div className="p-1.5 bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 shrink-0">
                      <UserPlus className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
