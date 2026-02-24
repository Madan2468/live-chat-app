"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Smile,
  Trash2,
  ChevronLeft,
  Loader2,
  ArrowDown,
  Hash,
  Info,
  MoreVertical,
  UserPlus,
  Trash,
  Sparkles,
  Lightbulb,
  Pencil,
  CornerUpLeft,
  Pin,
  PinOff,
  X,
  Check,
  Paperclip,
  Video,
  Phone,
  Image as ImageIcon,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { formatMessageTime } from "@/lib/utils";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import UserProfilePanel from "./UserProfilePanel";
import AddGroupMemberModal from "./AddGroupMemberModal";
import MessageDateDivider from "./MessageDateDivider";
import { isSameDay } from "date-fns";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];
const MAX_CHARS = 1000;

/** Conversation starter suggestions */
const DM_STARTERS = [
  { emoji: "👋", text: "Hey! How's it going?" },
  { emoji: "☕", text: "Got time for a quick chat?" },
  { emoji: "🎉", text: "Great to connect with you!" },
  { emoji: "🤔", text: "What are you working on lately?" },
  { emoji: "😄", text: "Tell me something fun about yourself!" },
  { emoji: "🚀", text: "What's your favourite project so far?" },
];

const GROUP_STARTERS = [
  { emoji: "👋", text: "Hey everyone!" },
  { emoji: "📋", text: "What's on everyone's agenda today?" },
  { emoji: "💡", text: "Anyone have ideas to share?" },
  { emoji: "🎯", text: "Let's get things started!" },
  { emoji: "🙌", text: "Happy to be here with you all!" },
  { emoji: "📣", text: "Quick check-in — how is everyone?" },
];

type ReplyTarget = {
  _id: string;
  content: string;
  senderName: string;
};

export default function ChatWindow() {
  const { conversationId } = useParams();
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { theme } = useTheme();

  const [message, setMessage] = useState("");
  const [showInputEmoji, setShowInputEmoji] = useState(false);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [showMsgEmojiPickerFor, setShowMsgEmojiPickerFor] = useState<string | null>(null);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const [profileUser, setProfileUser] = useState<{
    name?: string; email?: string; image?: string; isOnline?: boolean;
  } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);

  // Edit state
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Reply state
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenuDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingMsgId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(editContent.length, editContent.length);
    }
  }, [editingMsgId]);

  // Focus main input when reply target is set
  useEffect(() => {
    if (replyTarget && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyTarget]);

  const conversation = useQuery(api.conversations.list)?.find(c => c._id === conversationId);
  const messages = useQuery(api.messages.list, { conversationId: conversationId as any });
  const pinnedMessages = useQuery(api.messages.listPinned, { conversationId: conversationId as any });

  const sendMessage = useMutation(api.messages.send);
  const deleteMessage = useMutation(api.messages.remove);
  const editMessage = useMutation(api.messages.edit);
  const pinMessage = useMutation(api.messages.pin);
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

  const handleSend = async (e?: React.FormEvent, retryContent?: string) => {
    e?.preventDefault();
    const content = retryContent ?? message;
    if (!content.trim() || !conversationId) return;
    if (!retryContent) setMessage("");
    setSendError(null);
    setFailedMessage(null);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTyping({ conversationId: conversationId as any, isTyping: false });
    const replyToId = replyTarget?._id as any ?? undefined;
    setReplyTarget(null);
    try {
      await sendMessage({
        conversationId: conversationId as any,
        content,
        type: "text",
        replyToId,
      });
    } catch (err: any) {
      console.error("Failed to send message", err);
      setFailedMessage(content);
      setSendError(err?.message ?? "Failed to send. Please retry.");
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length > MAX_CHARS) return;
    setMessage(val);
    setTyping({ conversationId: conversationId as any, isTyping: val.length > 0 });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (val.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        setTyping({ conversationId: conversationId as any, isTyping: false });
      }, 2000);
    }
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
    setIsDeleting(true);
    setShowMenuDropdown(false);
    try {
      await deleteConversation({ conversationId: conversationId as any });
      router.push("/");
    } catch (err: any) {
      console.error("Failed to delete conversation:", err?.message);
      setIsDeleting(false);
      alert(err?.message ?? "Failed to delete conversation. Please try again.");
    }
  };

  // --- Edit helpers ---
  const startEdit = (msgId: string, currentContent: string) => {
    setEditingMsgId(msgId);
    setEditContent(currentContent);
    setHoveredMsgId(null);
  };

  const cancelEdit = () => {
    setEditingMsgId(null);
    setEditContent("");
  };

  const submitEdit = async (msgId: string) => {
    if (!editContent.trim()) return;
    try {
      await editMessage({ messageId: msgId as any, content: editContent });
    } catch (err: any) {
      console.error("Edit failed", err);
    }
    cancelEdit();
  };

  // --- Pin helpers ---
  const handlePin = async (msgId: string, currentlyPinned: boolean) => {
    await pinMessage({ messageId: msgId as any, isPinned: !currentlyPinned });
    setHoveredMsgId(null);
  };

  // --- Image upload ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;
    // For now, convert to base64 data URL and send as content
    // In a real app you'd upload to Convex file storage
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      try {
        await sendMessage({
          conversationId: conversationId as any,
          content: dataUrl,
          type: "image",
        });
      } catch (err) {
        console.error("Image send failed", err);
      }
    };
    reader.readAsDataURL(file);
    // reset input
    e.target.value = "";
  };

  const latestPinned = pinnedMessages?.[pinnedMessages.length - 1];

  if (isDeleting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background gap-4">
        <div className="relative">
          <div className="p-6 bg-destructive/10 rounded-full border-2 border-destructive/20">
            <Trash className="h-10 w-10 text-destructive opacity-80" />
          </div>
          <div className="absolute inset-0 blur-2xl bg-destructive/15 animate-pulse -z-10" />
        </div>
        <p className="text-muted-foreground font-semibold animate-pulse">Deleting conversation…</p>
      </div>
    );
  }

  if (messages === undefined || conversation === undefined) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background gap-4">
        <div className="relative">
          <div className="p-6 bg-primary/10 rounded-full border-2 border-primary/20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
          <div className="absolute inset-0 blur-2xl bg-primary/15 animate-pulse -z-10" />
        </div>
        <p className="text-muted-foreground font-medium animate-pulse">Loading chat…</p>
      </div>
    );
  }

  const charsLeft = MAX_CHARS - message.length;
  const charsWarning = charsLeft < 100;

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative transition-colors duration-300">
      <UserProfilePanel user={profileUser} isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

      {conversation.isGroup && (
        <AddGroupMemberModal
          conversationId={conversationId as string}
          isOpen={showAddMember}
          onClose={() => setShowAddMember(false)}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ─── Header ─── */}
      <header className="h-[68px] px-5 flex items-center justify-between border-b border-border bg-card/70 backdrop-blur-xl z-20 sticky top-0">
        {/* Subtle gradient shimmer overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 animate-shimmer opacity-20 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => router.push("/")}
            className="md:hidden p-2 -ml-1 hover:bg-accent rounded-xl transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Avatar */}
          <button
            className="relative focus:outline-none group"
            onClick={() => !conversation.isGroup && conversation.otherUser && openProfile(conversation.otherUser)}
            title={conversation.isGroup ? undefined : "View profile"}
          >
            {conversation.isGroup ? (
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Hash className="h-5 w-5 text-white" />
              </div>
            ) : (
              <div className="relative">
                <img
                  src={conversation.otherUser?.image}
                  className="h-11 w-11 rounded-2xl border-2 border-border shadow-md object-cover transition-all duration-300 group-hover:scale-105 group-hover:border-primary/60"
                />
                {conversation.otherUser?.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 border-2 border-card rounded-full animate-online-ring" />
                )}
              </div>
            )}
          </button>

          {/* Name & Status */}
          <button
            className="flex flex-col text-left focus:outline-none group"
            onClick={() => !conversation.isGroup && conversation.otherUser && openProfile(conversation.otherUser)}
          >
            <h3 className="text-[15px] font-extrabold text-foreground leading-tight tracking-tight group-hover:text-primary transition-colors duration-200">
              {conversation.isGroup ? conversation.name : conversation.otherUser?.name}
            </h3>
            {otherTypingUsers.length > 0 ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex items-center gap-0.5 px-2 py-0.5 bg-primary/10 rounded-full">
                  <span className="typing-dot text-primary" />
                  <span className="typing-dot text-primary" />
                  <span className="typing-dot text-primary" />
                </div>
                <p className="text-[11px] text-primary font-bold tracking-wide">
                  {otherTypingUsers.length === 1
                    ? `${otherTypingUsers[0].name} is typing`
                    : "Multiple people are typing"}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-0.5">
                <div
                  className={`h-1.5 w-1.5 rounded-full ${conversation.isGroup
                    ? "bg-emerald-500"
                    : conversation.otherUser?.isOnline
                      ? "bg-green-500"
                      : "bg-muted-foreground/40"
                    }`}
                />
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  {conversation.isGroup
                    ? `${conversation.memberCount} members`
                    : conversation.otherUser?.isOnline
                      ? "Active now"
                      : "Offline"}
                </p>
              </div>
            )}
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 relative z-10" ref={menuRef}>
          {/* Decorative call/video icons */}
          <button
            className="p-2.5 hover:bg-accent rounded-xl text-muted-foreground transition-all duration-200 hover:text-primary"
            title="Voice call (coming soon)"
            onClick={() => { }}
          >
            <Phone className="h-4.5 w-4.5" />
          </button>
          <button
            className="p-2.5 hover:bg-accent rounded-xl text-muted-foreground transition-all duration-200 hover:text-primary"
            title="Video call (coming soon)"
            onClick={() => { }}
          >
            <Video className="h-4.5 w-4.5" />
          </button>

          {!conversation.isGroup && (
            <button
              onClick={() => conversation.otherUser && openProfile(conversation.otherUser)}
              className="p-2.5 hover:bg-accent rounded-xl text-muted-foreground transition-all duration-200 hover:text-primary"
              title="View profile"
            >
              <Info className="h-5 w-5" />
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowMenuDropdown(v => !v)}
              className="p-2.5 hover:bg-accent rounded-xl text-muted-foreground transition-all duration-200 hover:text-foreground"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {showMenuDropdown && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                {conversation.isGroup && (
                  <button
                    onClick={() => { setShowAddMember(true); setShowMenuDropdown(false); }}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-accent transition-colors text-sm font-bold text-foreground"
                  >
                    <UserPlus className="h-4 w-4 text-primary" />
                    Add Members
                  </button>
                )}
                {conversation.isGroup && <div className="h-px bg-border mx-4" />}
                <button
                  onClick={handleDeleteChat}
                  disabled={isDeleting}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-destructive/10 transition-colors text-sm font-bold text-destructive disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                  Delete Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── Pinned Message Banner ─── */}
      {latestPinned && !latestPinned.isDeleted && (
        <div className="animate-pin-slide mx-0 px-5 py-2.5 flex items-center gap-3 bg-primary/5 border-b border-primary/15 text-sm">
          <Pin className="h-3.5 w-3.5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest mr-2">Pinned</span>
            <span className="text-foreground/80 font-medium truncate text-xs">{latestPinned.content}</span>
          </div>
          <button
            onClick={() => handlePin(latestPinned._id, true)}
            className="p-1 rounded-lg hover:bg-primary/10 text-muted-foreground transition-colors"
            title="Unpin"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ─── Messages ─── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scroll-smooth custom-scrollbar bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"
        onClick={() => { setShowMsgEmojiPickerFor(null); setHoveredMsgId(null); setShowMenuDropdown(false); }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-500 px-4">
            {/* Floating icon */}
            <div className="relative">
              <div className="p-8 bg-gradient-to-br from-primary/10 to-violet-500/10 rounded-full border-2 border-primary/20 animate-float">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <div className="absolute inset-0 blur-3xl bg-primary/15 -z-10 rounded-full" />
            </div>

            {/* Heading */}
            <div className="max-w-[280px]">
              <p className="text-xl font-black text-foreground">Start the conversation!</p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Say hello to{" "}
                <span className="font-bold text-primary">
                  {conversation.isGroup ? conversation.name : conversation.otherUser?.name}
                </span>
                .
              </p>
            </div>

            {/* Conversation starter chips */}
            <div className="w-full max-w-sm">
              <div className="flex items-center gap-2 mb-3 justify-center">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                  Conversation starters
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(conversation.isGroup ? GROUP_STARTERS : DM_STARTERS).map((starter) => (
                  <button
                    key={starter.text}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!conversationId) return;
                      sendMessage({
                        conversationId: conversationId as any,
                        content: starter.text,
                        type: "text",
                      }).catch(console.error);
                    }}
                    className="flex items-start gap-2.5 p-3 rounded-2xl text-left bg-accent/60 hover:bg-accent border border-border hover:border-primary/30 hover:shadow-md hover:shadow-primary/10 transition-all duration-200 group active:scale-95"
                  >
                    <span className="text-xl leading-none mt-0.5 group-hover:scale-125 transition-transform duration-200">
                      {starter.emoji}
                    </span>
                    <span className="text-[12px] font-semibold text-foreground leading-snug">
                      {starter.text}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-3 font-semibold">
                Tap any suggestion to send it instantly
              </p>
            </div>
          </div>
        ) : (
          (() => {
            const elements: React.ReactNode[] = [];
            messages.forEach((msg, i) => {
              // Date divider
              const prev = messages[i - 1];
              const needsDivider =
                i === 0 || !isSameDay(new Date(prev._creationTime), new Date(msg._creationTime));
              if (needsDivider) {
                elements.push(<MessageDateDivider key={`divider-${msg._id}`} timestamp={msg._creationTime} />);
              }

              if (msg.type === "system") {
                elements.push(
                  <div key={msg._id} className="flex justify-center my-4">
                    <div className="bg-primary/5 text-primary/80 px-5 py-2 rounded-full text-[12px] font-bold tracking-wide border border-primary/10 shadow-sm backdrop-blur-md">
                      {msg.content}
                    </div>
                  </div>
                );
                return;
              }

              const isMe = msg.sender?.clerkId === clerkUser?.id;
              const showAvatar = !isMe && (i === 0 || messages[i - 1].senderId !== msg.senderId);
              const isHovered = hoveredMsgId === msg._id;
              const showMsgEmoji = showMsgEmojiPickerFor === msg._id;
              const isEditing = editingMsgId === msg._id;
              const isPinned = msg.isPinned === true;

              elements.push(
                <div
                  key={msg._id}
                  className={`flex gap-3 group relative ${isMe ? "flex-row-reverse" : ""} animate-message-pop`}
                  onMouseEnter={() => setHoveredMsgId(msg._id)}
                  onMouseLeave={() => { if (!showMsgEmoji) setHoveredMsgId(null); }}
                >
                  {/* Avatar column */}
                  {!isMe && (
                    <div className="w-9 shrink-0 mt-auto">
                      {showAvatar && (
                        <button
                          onClick={(e) => { e.stopPropagation(); msg.sender && openProfile(msg.sender as any); }}
                          className="focus:outline-none"
                        >
                          <img
                            src={msg.sender?.image}
                            className="h-9 w-9 rounded-xl shadow border border-border hover:scale-110 hover:border-primary/50 transition-all object-cover"
                          />
                        </button>
                      )}
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                    {!isMe && showAvatar && (
                      <button
                        className="text-[11px] font-bold text-muted-foreground mb-1 ml-1 hover:text-primary transition-colors"
                        onClick={(e) => { e.stopPropagation(); msg.sender && openProfile(msg.sender as any); }}
                      >
                        {msg.sender?.name}
                      </button>
                    )}

                    <div className={`relative flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      {/* Action toolbar on hover */}
                      {isHovered && !msg.isDeleted && !isEditing && (
                        <div
                          className={`absolute ${isMe ? "right-full mr-2" : "left-full ml-2"} top-1/2 -translate-y-1/2 z-30 flex items-center gap-0.5 bg-card border border-border rounded-2xl px-1.5 py-1.5 shadow-xl animate-in fade-in zoom-in-90 duration-150`}
                          onClick={e => e.stopPropagation()}
                        >
                          {/* Quick reacts */}
                          {QUICK_EMOJIS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => handleQuickReact(msg._id, emoji)}
                              className="text-base hover:scale-150 active:scale-90 transition-transform duration-150 leading-none p-0.5 rounded-md hover:bg-accent"
                            >
                              {emoji}
                            </button>
                          ))}
                          {/* Full emoji picker */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMsgEmojiPickerFor(showMsgEmoji ? null : msg._id);
                            }}
                            className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Smile className="h-4 w-4" />
                          </button>

                          {/* Divider */}
                          <div className="w-px h-5 bg-border mx-0.5" />

                          {/* Reply */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplyTarget({
                                _id: msg._id,
                                content: msg.content,
                                senderName: msg.sender?.name ?? "Unknown",
                              });
                            }}
                            className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                            title="Reply"
                          >
                            <CornerUpLeft className="h-4 w-4" />
                          </button>

                          {/* Pin */}
                          <button
                            onClick={() => handlePin(msg._id, isPinned)}
                            className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-amber-500 transition-colors"
                            title={isPinned ? "Unpin" : "Pin"}
                          >
                            {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                          </button>

                          {/* Edit (own messages only) */}
                          {isMe && (
                            <button
                              onClick={() => startEdit(msg._id, msg.content)}
                              className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}

                          {/* Delete */}
                          {isMe && (
                            <button
                              onClick={() => deleteMessage({ messageId: msg._id as any })}
                              className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Full emoji picker */}
                      {showMsgEmoji && (
                        <div
                          className={`absolute ${isMe ? "right-full mr-2" : "left-full ml-2"} bottom-0 z-50 shadow-2xl rounded-3xl overflow-hidden border border-border animate-in fade-in slide-in-from-bottom-3 duration-200`}
                          onClick={e => e.stopPropagation()}
                        >
                          <EmojiPicker
                            theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
                            onEmojiClick={(e) => handleQuickReact(msg._id, e.emoji)}
                            height={360}
                            width={300}
                          />
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`px-4 py-2.5 rounded-2xl transition-all duration-200 ${isMe
                          ? "bubble-out text-white rounded-tr-none"
                          : "bg-card text-foreground rounded-tl-none border border-border shadow-sm hover:shadow-md"
                          } ${msg.isDeleted ? "opacity-50 grayscale" : ""} ${isPinned ? "ring-2 ring-amber-400/30" : ""}`}
                      >
                        {/* Reply quote */}
                        {msg.replyTo && (
                          <div className={`reply-quote mb-2 px-2.5 py-1.5 rounded text-[12px] ${isMe ? "opacity-80" : ""}`}>
                            <p className="font-black text-[10px] mb-0.5 opacity-70 uppercase tracking-wider">
                              {msg.replyTo.senderName}
                            </p>
                            <p className="truncate opacity-80">
                              {msg.replyTo.isDeleted ? "Message deleted" : msg.replyTo.content}
                            </p>
                          </div>
                        )}

                        {/* Image or text */}
                        {msg.type === "image" && !msg.isDeleted ? (
                          <img
                            src={msg.content}
                            alt="Sent image"
                            className="max-w-[220px] max-h-[280px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={e => e.stopPropagation()}
                          />
                        ) : isEditing ? (
                          <div className="flex flex-col gap-2 min-w-[180px]" onClick={e => e.stopPropagation()}>
                            <textarea
                              ref={editInputRef}
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitEdit(msg._id); }
                                if (e.key === "Escape") cancelEdit();
                              }}
                              className="bg-transparent outline-none resize-none text-[14px] leading-relaxed w-full"
                              rows={2}
                            />
                            <div className="flex items-center gap-1.5 justify-end">
                              <button onClick={cancelEdit} className="p-1 rounded-lg hover:bg-white/10 text-current opacity-60 hover:opacity-100 transition-opacity">
                                <X className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => submitEdit(msg._id)} className="p-1 rounded-lg hover:bg-white/10 text-current opacity-60 hover:opacity-100 transition-opacity">
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className={`text-[14px] leading-relaxed ${msg.isDeleted ? "italic font-medium" : ""}`}>
                            {msg.content}
                          </p>
                        )}
                      </div>

                      {/* Timestamp + edited label */}
                      <div className={`mt-1 flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 ${isMe ? "text-primary/60 mr-1" : "text-muted-foreground/60 ml-1"}`}>
                        {formatMessageTime(msg._creationTime)}
                        {msg.editedAt && !msg.isDeleted && (
                          <span className="text-[9px] opacity-60 normal-case tracking-normal font-semibold">(edited)</span>
                        )}
                        {isPinned && (
                          <Pin className="h-2.5 w-2.5 text-amber-500" />
                        )}
                      </div>

                      {/* Reactions */}
                      {msg.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {msg.reactions
                            .reduce((acc: any[], r) => {
                              const ex = acc.find(x => x.emoji === r.emoji);
                              if (ex) ex.count++;
                              else acc.push({ emoji: r.emoji, count: 1 });
                              return acc;
                            }, [])
                            .map(r => (
                              <button
                                key={r.emoji}
                                onClick={() => toggleReaction({ messageId: msg._id as any, emoji: r.emoji })}
                                className={`flex items-center gap-1.5 border rounded-full px-2.5 py-1 text-[12px] shadow-sm transition-all duration-200 hover:scale-110 active:scale-90 ${isMe
                                  ? "bg-white/10 border-white/20 text-white"
                                  : "bg-accent border-border text-foreground"
                                  }`}
                              >
                                {r.emoji} <span className="font-bold text-[10px]">{r.count}</span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            });
            return elements;
          })()
        )}
      </div>

      {/* Scroll to bottom button */}
      {showNewMessageButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground pl-4 pr-5 py-2.5 rounded-full shadow-2xl shadow-primary/30 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all z-30 flex items-center gap-2 text-xs font-black tracking-wider ring-4 ring-primary/20 animate-bounce"
        >
          <ArrowDown className="h-4 w-4" />
          New messages
        </button>
      )}

      {/* ─── Send Error Banner ─── */}
      {sendError && (
        <div className="mx-4 mb-2 flex items-center gap-3 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-2xl text-sm animate-in slide-in-from-bottom-2 duration-300">
          <span className="text-destructive font-semibold flex-1 truncate">⚠ {sendError}</span>
          <button
            onClick={() => handleSend(undefined, failedMessage ?? undefined)}
            className="shrink-0 px-3 py-1.5 bg-destructive text-white rounded-xl text-xs font-black hover:bg-destructive/90 transition-colors active:scale-95"
          >
            Retry
          </button>
          <button
            onClick={() => { setSendError(null); setFailedMessage(null); }}
            className="shrink-0 text-destructive/60 hover:text-destructive transition-colors font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Reply Preview Bar ─── */}
      {replyTarget && (
        <div className="mx-4 mb-1 animate-reply-slide flex items-center gap-3 px-4 py-2 bg-primary/5 border border-primary/20 rounded-2xl">
          <CornerUpLeft className="h-3.5 w-3.5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-primary uppercase tracking-wider">{replyTarget.senderName}</p>
            <p className="text-xs text-muted-foreground truncate">{replyTarget.content}</p>
          </div>
          <button
            onClick={() => setReplyTarget(null)}
            className="p-1 rounded-lg hover:bg-primary/10 text-muted-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ─── Input Area ─── */}
      <div className="p-4 bg-card/90 backdrop-blur-xl border-t border-border">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-5xl mx-auto">
          {/* Image/File attach */}
          <button
            type="button"
            className="p-3 hover:bg-accent rounded-2xl text-muted-foreground transition-all duration-200 hover:text-primary shrink-0"
            onClick={() => fileInputRef.current?.click()}
            title="Attach image"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          {/* Emoji trigger */}
          <div className="relative shrink-0">
            <button
              type="button"
              className="p-3 hover:bg-accent rounded-2xl text-muted-foreground transition-all duration-200 hover:text-primary hover:rotate-12"
              onClick={() => setShowInputEmoji(!showInputEmoji)}
            >
              <Smile className="h-6 w-6" />
            </button>
            {showInputEmoji && (
              <div className="absolute bottom-full left-0 mb-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
                <div className="shadow-2xl rounded-3xl overflow-hidden border border-border">
                  <EmojiPicker
                    theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
                    onEmojiClick={(e) => {
                      setMessage(prev => prev + e.emoji);
                      setShowInputEmoji(false);
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Input + char counter */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              placeholder={replyTarget ? `Reply to ${replyTarget.senderName}…` : "Type a message…"}
              className="w-full bg-accent/60 border-2 border-transparent rounded-2xl px-5 py-3.5 text-[14px] font-medium transition-all outline-none focus:border-primary/30 focus:bg-background focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/40"
              value={message}
              onChange={handleTyping}
            />
            {message.length > 0 && (
              <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold transition-colors ${charsWarning ? "text-orange-400" : "text-muted-foreground/40"}`}>
                {charsLeft}
              </span>
            )}
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-3.5 bg-gradient-to-br from-violet-600 to-rose-500 text-white rounded-2xl disabled:opacity-40 disabled:grayscale transition-all shadow-lg shadow-violet-500/25 active:scale-95 hover:shadow-violet-500/40 hover:scale-105 group shrink-0"
          >
            <Send className="h-5 w-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}
