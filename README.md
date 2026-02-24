# 💬 ChatApp — Real-Time Chat Application

A modern, full-stack real-time chat application built with **Next.js**, **Convex**, and **Clerk**. Supports direct messages, group chats, emoji reactions, typing indicators, online presence, and a beautiful dark/light UI.

---

## ✨ Features

| # | Feature | Details |
|---|---|---|
| 1 | 🔐 **Authentication** | Clerk-powered sign-up/login (email + social). Avatar & name displayed. User profiles stored in Convex for discovery. |
| 2 | 🔍 **User Search** | Shows all users (excluding yourself). Search bar filters by name as you type. Click to open or create a DM. |
| 3 | 💬 **Direct Messages** | Private 1-on-1 conversations. Real-time via Convex subscriptions. Sidebar previews the latest message. |
| 4 | 👥 **Group Chat** | Create groups with a name and multiple members. All members see messages in real-time. Member count in sidebar. |
| 5 | 🗂️ **Sidebar Filters** | Filter tab bar to easily switch between viewing **All**, **DMs**, and **Groups**, keeping your chat list organized. |
| 6 | ✏️ **Message Editing** | Inline edit your own messages after sending. Edited messages display an *"(edited)"* badge. |
| 7 | ↩️ **Reply Threading** | Quote previous messages in your reply. Displays an elegant quoted bubble above the replying message. |
| 8 | 📌 **Message Pinning** | Pin important messages. The latest pinned message displays in an elegant sliding banner at the top of the chat. |
| 9 | 🖼️ **Media Uploads** | Attach and send images natively within the chat flow using a built-in file picker. |
| 10 | 🕐 **Smart Timestamps** | Today → `2:34 PM` · Same year → `Feb 15, 2:34 PM` · Older → `Feb 15, 2024, 2:34 PM` |
| 11 | 🫙 **Empty States** | Immersive modern empty states with animated gradient backgrounds and helpful conversation starter chips. |
| 12 | 📱 **Responsive Layout** | Desktop: sidebar + chat side-by-side. Mobile: list view by default → full-screen chat with back button. |
| 13 | 🟢 **Online / Offline Status** | Green indicator next to online users. Updates in real-time as users open or close the app. |
| 14 | ⌨️ **Typing Indicator** | Modern animated bouncing three-dots indicator in the header when someone is typing. |
| 15 | 🔔 **Unread Count** | Animated badge per conversation. Cleared automatically when the conversation is opened. |
| 16 | ⬇️ **Smart Auto-Scroll** | Auto-scrolls to new messages. If scrolled up, shows an animated "↓ New messages" bouncy button instead. |
| 17 | 🗑️ **Delete Messages** | Delete your own messages. Shows *"This message was deleted"* for all users (soft delete). |
| 18 | 😄 **Reactions** | Floating reaction bubble grouping across messages. React with quick emojis or full picker. |
| 19 | ⚠️ **Error Handling** | Skeleton loaders & spinners while loading. Failed sends show an error banner with **Retry** + **Dismiss**. |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) |
| **Backend / Database** | [Convex](https://convex.dev) — real-time reactive database |
| **Authentication** | [Clerk](https://clerk.com) |
| **Styling** | Tailwind CSS v4 + custom animations |
| **UI Components** | [Lucide React](https://lucide.dev) icons, [emoji-picker-react](https://www.npmjs.com/package/emoji-picker-react) |
| **Date Utilities** | [date-fns](https://date-fns.org) |
| **Language** | TypeScript |

---

## 🗄️ Database Schema (Convex)

```
users              → name, email, image, clerkId, isOnline
conversations      → name (groups), isGroup, adminId
conversationMembers → conversationId, userId, lastSeenMessageId
messages           → conversationId, senderId, content, type, isDeleted
reactions          → messageId, userId, emoji
typingStatus       → conversationId, userId, lastUpdated
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Madan2468/live-chat-app.git
cd live-chat-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

> Get your Convex URL from [dashboard.convex.dev](https://dashboard.convex.dev)  
> Get your Clerk keys from [dashboard.clerk.com](https://dashboard.clerk.com)

### 4. Run the development server

```bash
# Run Next.js + Convex dev server together
npm run dev:all

# Or separately:
npx convex dev       # Terminal 1 — Convex backend
npm run dev          # Terminal 2 — Next.js frontend
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
├── convex/                  # Convex backend (queries, mutations, schema)
│   ├── schema.ts            # Database schema
│   ├── messages.ts          # Send, list, delete messages
│   ├── conversations.ts     # Create, list, delete conversations
│   ├── users.ts             # User sync, search, presence
│   ├── reactions.ts         # Emoji reactions
│   └── typing.ts            # Typing indicators
│
└── src/
    ├── app/
    │   ├── (auth)/          # Sign-in / Sign-up pages
    │   ├── (chat)/          # Main chat layout & conversation pages
    │   └── globals.css      # Global styles & animations
    │
    └── components/chat/
        ├── ChatSidebar.tsx         # Sidebar with search & conversation list
        ├── ChatWindow.tsx          # Main message area
        ├── ConversationList.tsx    # List of conversations with unread badges
        ├── UserSearch.tsx          # Search bar to find & start DMs
        ├── MessageDateDivider.tsx  # Date separators between messages
        ├── UserProfilePanel.tsx    # Slide-in user profile panel
        ├── AddGroupMemberModal.tsx # Add members to group chat
        ├── CreateGroupModal.tsx    # Create a new group chat
        └── ThemeToggle.tsx         # Dark / Light mode toggle
```

---

## 📦 Scripts

```bash
npm run dev        # Start Next.js dev server
npm run dev:all    # Start Next.js + Convex together
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

---

## 🔒 Security

- All Convex mutations verify `ctx.auth.getUserIdentity()` — unauthenticated requests are rejected
- Users can only delete their own messages
- Middleware protects all chat routes — unauthenticated users are redirected to `/sign-in`

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">Built with ❤️ using Next.js + Convex + Clerk</p>
