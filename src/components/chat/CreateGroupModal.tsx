"use client";

import { useState } from "react";
import { Plus, Users, X, Loader2, Hash } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";

export default function CreateGroupModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [name, setName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const users = useQuery(api.users.getUsers);
  const createGroup = useMutation(api.conversations.create);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || selectedUsers.length < 1) return;

    setIsSubmitting(true);
    try {
      const conversationId = await createGroup({
        name,
        isGroup: true,
        participantIds: selectedUsers.map(u => u._id),
      });
      router.push(`/conversations/${conversationId}`);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUser = (user: any) => {
    if (selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-card rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tight">Create Group</h2>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Start a new crew</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-accent rounded-2xl transition-all duration-300 hover:rotate-90">
            <X className="h-6 w-6 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-3">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">
              Group Name
            </label>
            <div className="relative group">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. The Dream Team"
                className="w-full bg-accent/50 border-2 border-transparent rounded-[1.25rem] pl-12 pr-4 py-4 text-base font-bold focus:border-primary/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1 flex justify-between items-center">
              Add Members
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg text-[10px]">{selectedUsers.length} selected</span>
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {users === undefined ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-bold text-muted-foreground animate-pulse">Finding your friends...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="py-12 text-center bg-accent/30 rounded-3xl border-2 border-dashed border-border">
                  <p className="text-sm font-bold text-foreground">No users available</p>
                  <p className="text-xs text-muted-foreground mt-1">Wait for someone to join the app!</p>
                </div>
              ) : (
                users.map(user => {
                  const isSelected = selectedUsers.find(u => u._id === user._id);
                  return (
                    <button
                      key={user._id}
                      type="button"
                      onClick={() => toggleUser(user)}
                      className={`w-full p-3 flex items-center gap-4 rounded-2xl transition-all duration-300 group ${isSelected
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                        : "bg-accent/40 hover:bg-accent hover:scale-[1.02]"
                        }`}
                    >
                      <div className="relative">
                        <img src={user.image} className={`h-12 w-12 rounded-xl border-2 transition-all group-hover:scale-105 ${isSelected ? "border-white/40" : "border-border"}`} />
                        {user.isOnline && (
                          <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 ${isSelected ? "bg-white border-primary" : "bg-green-500 border-background"}`} />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <span className={`text-base font-bold leading-none ${isSelected ? "text-white" : "text-foreground"}`}>
                          {user.name}
                        </span>
                        <p className={`text-xs mt-0.5 font-medium truncate max-w-[150px] ${isSelected ? "text-white/70" : "text-muted-foreground"}`}>
                          {user.email}
                        </p>
                      </div>
                      <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected
                        ? "bg-white border-white scale-110"
                        : "border-muted-foreground/30 group-hover:border-primary/50"
                        }`}>
                        {isSelected && <Plus className="h-4 w-4 text-primary font-black" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!name || selectedUsers.length < 1 || isSubmitting}
            className="w-full py-5 bg-primary text-primary-foreground rounded-[1.5rem] font-black text-base shadow-2xl shadow-primary/30 hover:bg-primary/90 disabled:opacity-50 disabled:grayscale transition-all active:scale-95 group flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Users className="h-6 w-6 group-hover:scale-110 transition-transform" />
                CREATE CREW
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
