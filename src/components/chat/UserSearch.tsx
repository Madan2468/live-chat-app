"use client";

import { useState } from "react";
import { Search, Loader2, UserPlus } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  // When query is empty, fetch all users; otherwise search by name
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

  // Show all users when focused with no query, search results otherwise
  const displayUsers = query ? searchResults : focused ? allUsers : null;
  const isLoading = displayUsers === undefined;
  const showDropdown = focused || !!query;

  return (
    <div className="relative group">
      <div className="relative">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${focused ? "text-primary" : "text-muted-foreground"}`} />
        <input
          type="text"
          placeholder="Find users to chat..."
          className="w-full pl-11 pr-4 py-3 bg-accent/50 border-2 border-transparent rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:bg-background focus:border-primary/20 transition-all outline-none placeholder:text-muted-foreground/50"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
        />
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-xl">
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !displayUsers || displayUsers.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-medium text-foreground">
                  {query ? `No users found for "${query}"` : "No other users registered yet"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {displayUsers.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleCreateChat(user._id)}
                    className="w-full p-3 flex items-center gap-4 hover:bg-accent rounded-xl transition-all duration-200 text-left group"
                  >
                    <div className="relative">
                      <img
                        src={user.image}
                        alt={user.name}
                        className="h-11 w-11 rounded-xl border border-border group-hover:scale-105 transition-transform"
                      />
                      {user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-green-500 border-2 border-card rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate leading-none mb-1">
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                      <UserPlus className="h-4 w-4 text-primary" />
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
