# 💬 ChatApp — Real-Time Chat Application

A modern, full-stack real-time chat application built with **Next.js**, **Convex**, and **Clerk**. Supports direct messages, group chats, emoji reactions, typing indicators, online presence, and a beautiful dark/light UI.

---

## ✨ Features

- 🔐 **Authentication** — Sign in / Sign up powered by Clerk (Google, GitHub, email)
- 💬 **Real-time Messaging** — Instant message delivery using Convex live queries (no polling)
- 👥 **Group Chats** — Create groups, add/remove members, manage conversations
- 😄 **Emoji Reactions** — React to any message with quick emojis or the full emoji picker
- ⌨️ **Typing Indicators** — See when someone is typing in real-time
- 🟢 **Online Presence** — Live online/offline status for every user
- 🔔 **Unread Badges** — Animated unread message count per conversation
- 🗓️ **Date Dividers** — Messages grouped by Today / Yesterday / date
- 💡 **Conversation Starters** — Clickable ice-breaker suggestions on empty chats
- 🌙 **Dark / Light Mode** — Smooth animated theme toggle with tooltip
- 🗑️ **Soft Delete** — Delete your own messages (shows "This message was deleted")
- 👤 **User Profile Panel** — Slide-in panel with gradient cover, online status
- 🔍 **User Search** — Search all registered users and start a DM instantly
- 📱 **Responsive Design** — Works on mobile and desktop

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
