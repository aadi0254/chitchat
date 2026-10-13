# ChitChat | File Map & Project Structure

## 1. Directory Tree

```
chit-chat/                                    # Workspace Root
└── chitchat/                                 # Git Repository Root (.git)
    ├── .git/                                 # Git tracking directory
    ├── app/                                  # Next.js 14 App Router Directory
    │   ├── globals.css                       # Global Tailwind & CSS custom properties
    │   ├── layout.tsx                        # Root HTML Layout & Font configuration
    │   └── page.tsx                          # Monolithic client component (Landing, Join, Chat)
    ├── lib/                                  # Shared utilities & services
    │   ├── socket-mock.ts                    # BroadcastChannel-based real-time mock
    │   └── utils.ts                          # Class merging, date format, room code generator
    ├── public/                               # Static assets directory
    │   └── test.css                          # Compiled standalone Tailwind artifact (unreferenced)
    ├── build_error.txt                       # Saved terminal error log from previous failed build
    ├── next-env.d.ts                         # Next.js TypeScript declaration shim
    ├── next.config.js                        # Next.js build configuration (swcMinify toggle)
    ├── package.json                          # Project manifest & script definitions
    ├── package-lock.json                     # Deterministic dependency lockfile (v3)
    ├── postcss.config.js                     # PostCSS plugin pipeline (tailwindcss, autoprefixer)
    ├── README.md                             # Original developer documentation & test guide
    ├── tailwind.config.ts                    # Tailwind CSS design system tokens and extensions
    ├── tsconfig.json                         # TypeScript compiler configuration & path aliases
    └── tsconfig.tsbuildinfo                  # TypeScript incremental compiler cache
```

---

## 2. Comprehensive File Inventory

### Application Source Files

#### `app/layout.tsx`
- **Location**: [`app/layout.tsx`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/layout.tsx)
- **Size**: 23 lines | 573 bytes
- **Role & Responsibility**: Serves as the top-level HTML root layout for the Next.js App Router. Enforces dark mode styling by applying the `dark` class to `<html>`, instantiates the Google Font `Inter` with Latin subset, and injects global metadata.
- **Exports**:
  - `metadata: Metadata` (Document title and description)
  - `default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>)`
- **Imports & Dependencies**:
  - `type { Metadata }` from `"next"`
  - `{ Inter }` from `"next/font/google"`
  - `./globals.css`
- **Callers / References**: Next.js App Router root layout engine.
- **Notes**: Disables automatic theme switching by hardcoding `<html lang="en" className="dark">`.

#### `app/globals.css`
- **Location**: [`app/globals.css`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/globals.css)
- **Size**: 72 lines | 1,397 bytes
- **Role & Responsibility**: Defines the core CSS architecture. Includes Tailwind base directives, custom HSL design tokens, body styles, custom scrollbar styling, and glassmorphic utility classes (`.glass`, `.glass-card`).
- **Exports**: None (CSS stylesheet).
- **Key Selectors & Rules**:
  - `:root`: Declares raw HSL color values for `--background`, `--foreground`, `--primary`, `--secondary`, `--accent`, `--card`, `--border`, `--input`, `--ring`, and `--radius: 0.75rem`.
  - `body`: Sets `background-color: hsl(var(--background))` and `color: hsl(var(--foreground))`.
  - `::-webkit-scrollbar`: Styles a sleek 6px custom scrollbar using `--accent` and `--primary`.
  - `.glass`: Semi-transparent background `rgba(15, 23, 42, 0.6)` with `backdrop-filter: blur(12px)`.
  - `.glass-card`: Semi-transparent background `rgba(30, 41, 59, 0.4)` with `backdrop-filter: blur(8px)`.
- **Imports & Dependencies**: Imported exclusively by `app/layout.tsx`.

#### `app/page.tsx`
- **Location**: [`app/page.tsx`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx)
- **Size**: 449 lines | 18,129 bytes
- **Role & Responsibility**: The primary monolithic client controller for the entire application. Governs state transitions across three views (`landing`, `join`, `chat`), manages form submissions, socket event subscriptions, message arrays, online user rosters, and clipboard operations.
- **Exports**: `default function Home()`
- **Imports & Dependencies**:
  - `React, { useState, useEffect, useRef }` from `"react"`
  - Icons from `"lucide-react"`: `PlusCircle`, `Users`, `MessageSquare`, `Send`, `Copy`, `LogOut`, `Check`, `Hash`, `User as UserIcon`, `ShieldCheck`, `ChevronRight`
  - Helpers from `@/lib/utils`: `cn`, `formatDate`, `generateRoomCode`
  - Real-time client from `@/lib/socket-mock`: `socket`, `ChatMessage`, `SocketEvent`
- **Internal State**:
  - `view`: `"landing" | "join" | "chat"`
  - `userInfo`: `{ name: string, room: string }`
  - `messages`: `ChatMessage[]`
  - `inputMessage`: `string`
  - `onlineUsers`: `string[]`
  - `copied`: `boolean`
  - `error`: `string`
  - `loading`: `boolean`
- **Lifecycle & Effects**:
  - Effect 1: Mount verification of `sessionStorage.getItem("chitchat_auth")` to automatically rejoin rooms.
  - Effect 2: Subscription to `socket.on((event) => ...)` to handle `MESSAGE`, `JOIN`, `PRESENCE`, and `LEAVE`.
  - Effect 3: Auto-scroll on new message via `messagesEndRef.current?.scrollIntoView()`.

#### `lib/socket-mock.ts`
- **Location**: [`lib/socket-mock.ts`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/lib/socket-mock.ts)
- **Size**: 105 lines | 3,053 bytes
- **Role & Responsibility**: Emulates a real-time WebSocket client by leveraging the browser's native `BroadcastChannel` API. Publishes and listens to events on a single channel named `"chitchat_rooms"`.
- **Exports**:
  - `export interface ChatMessage`: `{ id: string, sender: string, text: string, timestamp: number, type: "chat" | "system" }`
  - `export type SocketEvent`: Union of `JOIN`, `LEAVE`, `MESSAGE`, and `PRESENCE` events
  - `export const socket`: Singleton instance of `SocketMock` (guarded by `typeof window !== "undefined"`)
- **Key Methods**:
  - `join(room, user)`: Sets active room/user and emits `JOIN`.
  - `leave()`: Emits `LEAVE` to channel and local listeners, then clears internal state.
  - `broadcastPresence()`: Emits `PRESENCE` to notify newly joined peers.
  - `sendMessage(text)`: Constructs `ChatMessage` and broadcasts to other tabs while also invoking local listeners.
  - `on(listener)`: Registers a callback to receive events, returning an unsubscribe cleanup closure.
  - `getUser()`, `getRoom()`: Accessors for current session state.
- **Imports & Dependencies**: Pure TypeScript, browser-native `BroadcastChannel` API.

#### `lib/utils.ts`
- **Location**: [`lib/utils.ts`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/lib/utils.ts)
- **Size**: 24 lines | 602 bytes
- **Role & Responsibility**: Shared utility functions for styling and string formatting.
- **Exports**:
  - `cn(...inputs: ClassValue[])`: Tailwind class merger using `clsx` and `twMerge`.
  - `formatDate(date: number | Date)`: Returns formatted time string (e.g. `10:45 PM`) using `Intl.DateTimeFormat`.
  - `generateRoomCode()`: Generates a pseudo-random 6-character uppercase alphanumeric string (`[A-Z0-9]`).
- **Dependencies**: `"clsx"`, `"tailwind-merge"`.

---

### Configuration & Tooling Files

#### `package.json`
- **Location**: [`package.json`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/package.json)
- **Size**: 31 lines | 683 bytes
- **Role**: Declares application metadata, execution scripts, runtime dependencies, and devDependencies.
- **Scripts**:
  - `"dev": "next dev --turbo"` (Turbopack development server)
  - `"build": "next build"` (Production webpack/SWC build)
  - `"start": "next start"` (Production Node server)
  - `"lint": "next lint"` (ESLint runner)

#### `package-lock.json`
- **Location**: [`package-lock.json`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/package-lock.json)
- **Size**: 6,142 lines | 220,138 bytes
- **Role**: Strict dependency tree specification (npm lockfile format v3). Pins exact sub-dependencies including React 18.3.1, Next 14.2.4, Tailwind 3.4.19, and TypeScript 5.9.3.

#### `tailwind.config.ts`
- **Location**: [`tailwind.config.ts`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/tailwind.config.ts)
- **Size**: 63 lines | 1,771 bytes
- **Role**: Tailwind compiler configuration. Specifies content scanning globs (`./pages`, `./components`, `./app`), maps theme colors to CSS variables, configures border radius tokens, and defines keyframe animations (`fadeIn`, `slideUp`, `slideDown`).

#### `postcss.config.js`
- **Location**: [`postcss.config.js`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/postcss.config.js)
- **Size**: 7 lines | 89 bytes
- **Role**: Configures PostCSS transformations, registering `tailwindcss` and `autoprefixer` plugins.

#### `next.config.js`
- **Location**: [`next.config.js`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/next.config.js)
- **Size**: 7 lines | 221 bytes
- **Role**: Next.js framework configuration. Enables `reactStrictMode: true` and sets `swcMinify: false` (to bypass compatibility issues on newer Node releases).

#### `tsconfig.json`
- **Location**: [`tsconfig.json`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/tsconfig.json)
- **Size**: 27 lines | 600 bytes
- **Role**: TypeScript compiler configuration. Enforces `strict: true`, `noEmit: true`, path alias `@/*` -> `./*`, module resolution `bundler`, and isolated modules.

#### `next-env.d.ts`
- **Location**: [`next-env.d.ts`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/next-env.d.ts)
- **Size**: 6 lines | 206 bytes
- **Role**: Automatically generated Next.js TypeScript definitions for globals and image types.

---

### Non-Source Artifacts & Log Files

#### `build_error.txt`
- **Location**: [`build_error.txt`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/build_error.txt)
- **Size**: 5,168 bytes (UTF-16LE encoded on Windows)
- **Role**: Historical crash dump captured from a previous failed `next build` execution on the author's local workstation (`C:\Users\adity\OneDrive\Desktop\chitchat`).
- **Key Finding**: Records a webpack failure during `next/font` CSS preprocessing: `Error: Cannot find module 'autoprefixer'`.

#### `public/test.css`
- **Location**: [`public/test.css`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/public/test.css)
- **Size**: 1,354 lines | 25,665 bytes
- **Role**: Standalone precompiled Tailwind CSS file generated during local debugging of Tailwind compilation.
- **Key Finding**: Completely unreferenced in any HTML or TSX file. Serves as diagnostic evidence confirming that `.bg-background` compiles to `background-color: var(--background);` without `hsl()`.

#### `tsconfig.tsbuildinfo`
- **Location**: [`tsconfig.tsbuildinfo`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/tsconfig.tsbuildinfo)
- **Size**: 80,882 bytes
- **Role**: Binary/JSON incremental compilation state generated by `tsc` (TypeScript 5.9.3). Should typically be excluded by `.gitignore`.

#### `README.md`
- **Location**: [`README.md`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/README.md)
- **Size**: 41 lines | 1,574 bytes
- **Role**: Developer onboarding guide describing features, testing instructions using multiple browser tabs, and technology stack.
