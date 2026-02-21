"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  Send,
  Smile,
  Trash2,
  ChevronLeft,
  Loader2,
  ArrowDownCircle,
  Hash,
  Info,
  MoreVertical,
  UserPlus,
  Trash,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { formatMessageTime } from "@/lib/utils";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import UserProfilePanel from "./UserProfilePanel";
import AddGroupMemberModal from "./AddGroupMemberModal";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

export default function ChatWindow() {
  const { conversationId } = useParams();
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { theme } = useTheme();

  // State
  const [message, setMessage] = useState("");
  const [showInputEmoji, setShowInputEmoji] = useState(false);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [showMsgEmojiPickerFor, setShowMsgEmojiPickerFor] = useState<string | null>(null);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  // Profile panel state
  const [profileUser, setProfileUser] = useState<{
    name?: string; email?: string; image?: string; isOnline?: boolean;
  } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenuDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Convex queries & mutations
  const conversation = useQuery(api.conversations.list)?.find(c => c._id === conversationId);
  const messages = useQuery(api.messages.list, { conversationId: conversationId as any });
  const sendMessage = useMutation(api.messages.send);
  const deleteMessage = useMutation(api.messages.remove);
  const toggleReaction = useMutation(api.reactions.toggle);
  const setTyping = useMutation(api.typing.update);
  const markAsRead = useMutation(api.conversations.markAsRead);
  const deleteConversation = useMutation(api.conversations.deleteConversation);

  const typingStatus = useQuery(api.typing.get, { conversationId: conversationId as any });
  const otherTypingUsers = typingStatus?.filter(u => u.clerkId !== clerkUser?.id) || [];

  const { scrollRef, scrollToBottom, showNewMessageButton } = useAutoScroll([messages]);

  useEffect(() => {
    if (conversationId && messages) {
      markAsRead({ conversationId: conversationId as any });
    }
  }, [conversationId, messages, markAsRead]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || !conversationId) return;
    const content = message;
    setMessage("");
    setTyping({ conversationId: conversationId as any, isTyping: false });
    try {
      await sendMessage({ conversationId: conversationId as any, content, type: "text" });
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    setTyping({ conversationId: conversationId as any, isTyping: e.target.value.length > 0 });
  };

  const openProfile = (user: { name?: string; email?: string; image?: string; isOnline?: boolean }) => {
    setProfileUser(user);
    setProfileOpen(true);
  };

  const handleQuickReact = (msgId: string, emoji: string) => {
    toggleReaction({ messageId: msgId as any, emoji });
    setHoveredMsgId(null);
    setShowMsgEmojiPickerFor(null);
  };

  const handleDeleteChat = async () => {
    if (!confirm("Delete this entire conversation? This cannot be undone.")) return;

    // Set loading state first
    setIsDeleting(true);
    setShowMenuDropdown(false);

    try {
      // Wait for deletion to actually complete in the backend
      await deleteConversation({ conversationId: conversationId as any });
      // Only navigate after successful deletion
      router.push("/");
    } catch (err: any) {
      console.error("Failed to delete conversation:", err?.message);
      setIsDeleting(false);
      alert(err?.message ?? "Failed to delete conversation. Please try again.");
    }
  };

  if (isDeleting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background">
        <div className="relative">
          <Trash className="h-10 w-10 text-destructive opacity-60" />
          <div className="absolute inset-0 blur-xl bg-destructive/10 animate-pulse" />
        </div>
        <p className="mt-4 text-muted-foreground font-semibold animate-pulse">Deleting conversation...</p>
      </div>
    );
  }

  if (messages === undefined || conversation === undefined) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="absolute inset-0 blur-lg bg-primary/20 animate-pulse" />
        </div>
        <p className="mt-4 text-muted-foreground font-medium animate-pulse">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative transition-colors duration-300">
      {/* User Profile Slide Panel */}
      <UserProfilePanel
        user={profileUser}
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      {/* Add Group Member Modal */}
      {conversation.isGroup && (
        <AddGroupMemberModal
          conversationId={conversationId as string}
          isOpen={showAddMember}
          onClose={() => setShowAddMember(false)}
        />
      )}

      {/* ─── Header ─── */}
      <header className="h-20 px-6 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-xl z-20 sticky top-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/")} className="md:hidden p-2 -ml-2 hover:bg-accent rounded-xl transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Clickable avatar */}
          <button
            className="relative group focus:outline-none"
            onClick={() => !conversation.isGroup && conversation.otherUser && openProfile(conversation.otherUser)}
            title={conversation.isGroup ? undefined : "View profile"}
          >
            {conversation.isGroup ? (
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Hash className="h-6 w-6 text-white" />
              </div>
            ) : (
              <div className="relative">
                <img
                  src={conversation.otherUser?.image}
                  className="h-12 w-12 rounded-2xl border-2 border-border shadow-md transition-all duration-300 group-hover:scale-105 group-hover:border-primary/60"
                />
                <div className="absolute inset-0 rounded-2xl ring-2 ring-primary/0 group-hover:ring-primary/30 transition-all duration-300" />
                {conversation.otherUser?.isOnline && (
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full shadow-lg" />
                )}
              </div>
            )}
          </button>

          {/* Name & status — clickable for 1-on-1 */}
          <button
            className="flex flex-col text-left focus:outline-none group"
            onClick={() => !conversation.isGroup && conversation.otherUser && openProfile(conversation.otherUser)}
          >
            <h3 className="text-base font-bold text-foreground leading-tight tracking-tight group-hover:text-primary transition-colors duration-200">
              {conversation.isGroup ? conversation.name : conversation.otherUser?.name}
            </h3>
            {otherTypingUsers.length > 0 ? (
              <p className="text-[11px] text-primary font-bold animate-pulse tracking-wide italic">
                {otherTypingUsers.length === 1
                  ? `${otherTypingUsers[0].name} is typing...`
                  : "Multiple users are typing..."}
              </p>
            ) : (
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`h-1.5 w-1.5 rounded-full ${conversation.isGroup ? "bg-emerald-500" : (conversation.otherUser?.isOnline ? "bg-green-500" : "bg-muted-foreground/40")}`} />
                <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest">
                  {conversation.isGroup
                    ? `${conversation.memberCount} members`
                    : (conversation.otherUser?.isOnline ? "Active now" : "Offline")}
                </p>
              </div>
            )}
          </button>
        </div>

        {/* Right side action buttons */}
        <div className="flex items-center gap-1" ref={menuRef}>
          {!conversation.isGroup && (
            <button
              onClick={() => conversation.otherUser && openProfile(conversation.otherUser)}
              className="p-2.5 hover:bg-accent rounded-xl text-muted-foreground transition-all duration-300 hover:text-primary"
              title="View profile"
            >
              <Info className="h-6 w-6" />
            </button>
          )}

          {/* 3-dot menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenuDropdown(v => !v)}
              className="p-2.5 hover:bg-accent rounded-xl text-muted-foreground transition-all duration-300 hover:text-foreground"
              title="Options"
            >
              <MoreVertical className="h-6 w-6" />
            </button>

            {showMenuDropdown && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-2xl shadow-2xl shadow-black/10 overflow-hidden z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Add Members — only for group chats */}
                {conversation.isGroup && (
                  <button
                    onClick={() => { setShowAddMember(true); setShowMenuDropdown(false); }}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-accent transition-colors text-sm font-bold text-foreground"
                  >
                    <UserPlus className="h-5 w-5 text-primary" />
                    Add Members
                  </button>
                )}

                {/* Divider if both options shown */}
                {conversation.isGroup && <div className="h-px bg-border mx-4" />}

                {/* Delete Chat */}
                <button
                  onClick={handleDeleteChat}
                  disabled={isDeleting}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-destructive/10 transition-colors text-sm font-bold text-destructive disabled:opacity-50"
                >
                  {isDeleting
                    ? <Loader2 className="h-5 w-5 animate-spin" />
                    : <Trash className="h-5 w-5" />
                  }
                  Delete Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── Messages ─── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent custom-scrollbar"
        onClick={() => { setShowMsgEmojiPickerFor(null); setHoveredMsgId(null); setShowMenuDropdown(false); }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="p-8 bg-primary/10 rounded-full border-2 border-primary/20">
                <Send className="h-12 w-12 text-primary rotate-45" />
              </div>
              <div className="absolute inset-0 blur-2xl bg-primary/20 -z-10" />
            </div>
            <div className="max-w-[280px]">
              <p className="text-xl font-bold text-foreground">Start chatting!</p>
              <p className="text-sm text-muted-foreground mt-2">
                Send a message to {conversation.isGroup ? "the group" : conversation.otherUser?.name}.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender?.clerkId === clerkUser?.id;
            const showAvatar = !isMe && (i === 0 || messages[i - 1].senderId !== msg.senderId);
            const isHovered = hoveredMsgId === msg._id;
            const showMsgEmoji = showMsgEmojiPickerFor === msg._id;

            return (
              <div
                key={msg._id}
                className={`flex gap-4 group relative ${isMe ? "flex-row-reverse" : ""}`}
                onMouseEnter={() => setHoveredMsgId(msg._id)}
                onMouseLeave={() => { if (!showMsgEmoji) setHoveredMsgId(null); }}
              >
                {!isMe && (
                  <div className="w-10 shrink-0">
                    {showAvatar && (
                      <button
                        onClick={(e) => { e.stopPropagation(); msg.sender && openProfile(msg.sender as any); }}
                        className="focus:outline-none"
                      >
                        <img
                          src={msg.sender?.image}
                          className="h-10 w-10 rounded-xl shadow-md border border-border hover:scale-110 hover:border-primary/50 transition-all cursor-pointer"
                        />
                      </button>
                    )}
                  </div>
                )}

                <div className={`flex flex-col max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && showAvatar && (
                    <button
                      className="text-[11px] font-bold text-muted-foreground mb-1 ml-1 tracking-wide hover:text-primary transition-colors"
                      onClick={(e) => { e.stopPropagation(); msg.sender && openProfile(msg.sender as any); }}
                    >
                      {msg.sender?.name}
                    </button>
                  )}

                  <div className={`relative flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {/* Hover quick-react bar */}
                    {isHovered && !msg.isDeleted && (
                      <div
                        className={`absolute ${isMe ? "right-full mr-2" : "left-full ml-2"} top-1/2 -translate-y-1/2 z-30 flex items-center gap-1 bg-card border border-border rounded-2xl px-2 py-1.5 shadow-xl shadow-black/10 animate-in fade-in zoom-in-90 duration-150`}
                        onClick={e => e.stopPropagation()}
                      >
                        {QUICK_EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleQuickReact(msg._id, emoji)}
                            className="text-lg hover:scale-150 active:scale-90 transition-transform duration-150 leading-none p-[2px] rounded-md hover:bg-accent"
                          >
                            {emoji}
                          </button>
                        ))}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMsgEmojiPickerFor(showMsgEmoji ? null : msg._id);
                          }}
                          className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Smile className="h-5 w-5" />
                        </button>
                      </div>
                    )}

                    {/* Full emoji picker for a message */}
                    {showMsgEmoji && (
                      <div
                        className={`absolute ${isMe ? "right-full mr-2" : "left-full ml-2"} bottom-0 z-50 shadow-2xl rounded-3xl overflow-hidden border border-border animate-in fade-in slide-in-from-bottom-3 duration-200`}
                        onClick={e => e.stopPropagation()}
                      >
                        <EmojiPicker
                          theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
                          onEmojiClick={(emojiData) => handleQuickReact(msg._id, emojiData.emoji)}
                          height={380}
                          width={320}
                        />
                      </div>
                    )}

                    <div className={`px-5 py-3 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md ${isMe
                      ? "bg-gradient-to-br from-indigo-600 to-primary text-white rounded-tr-none"
                      : "bg-card text-foreground rounded-tl-none border border-border"
                      } ${msg.isDeleted ? "opacity-50 grayscale" : ""}`}>
                      <p className={`text-[15px] leading-relaxed ${msg.isDeleted ? "italic font-medium" : ""}`}>
                        {msg.content}
                      </p>
                    </div>
                  </div>

                  {/* Timestamp + Delete */}
                  <div className={`mt-1.5 flex items-center gap-3 text-[10px] font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 ${isMe ? "text-primary/70 mr-1" : "text-muted-foreground/70 ml-1"}`}>
                    {formatMessageTime(msg._creationTime)}
                    {isMe && !msg.isDeleted && (
                      <button
                        onClick={() => deleteMessage({ messageId: msg._id })}
                        className="hover:text-destructive flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        DELETE
                      </button>
                    )}
                  </div>

                  {/* Reactions */}
                  {msg.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.reactions.reduce((acc: any[], r) => {
                        const existing = acc.find(x => x.emoji === r.emoji);
                        if (existing) existing.count++;
                        else acc.push({ emoji: r.emoji, count: 1 });
                        return acc;
                      }, []).map(r => (
                        <button
                          key={r.emoji}
                          onClick={() => toggleReaction({ messageId: msg._id, emoji: r.emoji })}
                          className={`flex items-center gap-1.5 border rounded-full px-2.5 py-1 text-[13px] shadow-sm transition-all duration-300 hover:scale-110 active:scale-90 ${isMe ? "bg-primary/10 border-primary/20 text-primary" : "bg-accent border-border text-foreground"}`}
                        >
                          {r.emoji} <span className="font-bold text-[11px]">{r.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showNewMessageButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground p-3 rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all z-30 flex items-center gap-2 px-6 py-3 font-black text-xs tracking-widest ring-4 ring-primary/20 animate-bounce"
        >
          <ArrowDownCircle className="h-5 w-5" />
          GO TO BOTTOM
        </button>
      )}

      {/* ─── Input Area ─── */}
      <div className="p-6 bg-card/80 backdrop-blur-xl border-t border-border mt-auto">
        <form onSubmit={handleSend} className="flex items-center gap-3 max-w-5xl mx-auto">
          <div className="relative">
            <button
              type="button"
              className="p-3.5 hover:bg-accent rounded-2xl text-muted-foreground transition-all duration-300 hover:text-primary hover:rotate-12"
              onClick={() => setShowInputEmoji(!showInputEmoji)}
            >
              <Smile className="h-7 w-7" />
            </button>
            {showInputEmoji && (
              <div className="absolute bottom-full left-0 mb-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                <div className="shadow-2xl rounded-3xl overflow-hidden border border-border">
                  <EmojiPicker
                    theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
                    onEmojiClick={(emojiData) => {
                      setMessage(prev => prev + emojiData.emoji);
                      setShowInputEmoji(false);
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type something..."
              className="w-full bg-accent border-2 border-transparent rounded-2xl px-6 py-4 text-[15px] font-medium leading-tight transition-all outline-none focus:border-primary/30 focus:bg-background ring-primary/10 focus:ring-4 placeholder:text-muted-foreground/50"
              value={message}
              onChange={handleTyping}
            />
          </div>

          <button
            type="submit"
            disabled={!message.trim()}
            className="p-4 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 disabled:opacity-50 disabled:grayscale transition-all shadow-xl shadow-primary/20 active:scale-95 group"
          >
            <Send className="h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}
