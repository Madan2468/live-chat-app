"use client";

import { useState } from "react";
import { X, UserPlus, Loader2, Search, Check } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

type AddGroupMemberModalProps = {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function AddGroupMemberModal({
  conversationId,
  isOpen,
  onClose,
}: AddGroupMemberModalProps) {
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  const allUsers = useQuery(api.users.getUsers);
  const addGroupMember = useMutation(api.conversations.addGroupMember);

  if (!isOpen) return null;

  const filtered = allUsers?.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const handleAdd = async (userId: string) => {
    setAdding(userId);
    try {
      await addGroupMember({
        conversationId: conversationId as any,
        userId: userId as any,
      });
      setAddedIds((prev) => [...prev, userId]);
    } catch (err: any) {
      // Show a brief error (e.g. "already a member")
      alert(err?.message ?? "Failed to add member");
    } finally {
      setAdding(null);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div className="bg-card rounded-[2.5rem] w-full max-w-md shadow-2xl border border-border overflow-hidden pointer-events-auto animate-in zoom-in-95 fade-in duration-300">
          {/* Header */}
          <div className="p-7 border-b border-border flex items-center justify-between bg-card/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground tracking-tight">Add Members</h2>
                <p className="text-xs text-muted-foreground font-semibold tracking-widest uppercase mt-0.5">Grow your group</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-accent rounded-2xl transition-all hover:rotate-90 duration-300"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-accent/50 border-2 border-transparent rounded-2xl text-sm font-medium focus:border-primary/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          {/* User List */}
          <div className="max-h-80 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {allUsers === undefined ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-bold text-muted-foreground">No users found</p>
              </div>
            ) : (
              filtered.map((user) => {
                const isAdded = addedIds.includes(user._id);
                const isLoading = adding === user._id;
                return (
                  <div
                    key={user._id}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-accent/50 transition-all"
                  >
                    <div className="relative">
                      <img src={user.image} className="h-11 w-11 rounded-xl border border-border" />
                      {user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-card rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => !isAdded && !isLoading && handleAdd(user._id)}
                      disabled={isAdded || isLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${isAdded
                          ? "bg-green-500/10 text-green-500 cursor-default"
                          : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 shadow-md shadow-primary/20"
                        }`}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isAdded ? (
                        <>
                          <Check className="h-4 w-4" />
                          Added
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Add
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-border">
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-accent text-foreground rounded-2xl font-bold text-sm hover:bg-accent/80 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
