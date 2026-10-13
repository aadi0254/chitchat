# ChitChat | AI Coding Assistant Context & Operational Playbook

> **CRITICAL DIRECTIVE FOR INCOMING AI ASSISTANTS**  
> Read this document first before inspecting source code or making any modifications. This playbook is distilled from an exhaustive codebase intelligence audit and contains verified facts, critical caveats, bug alerts, and architectural boundaries.

---

## 1. Project Identity & Elevator Pitch

- **Project**: ChitChat (`v1.0.0`).
- **What it is**: A private, room-based real-time chat web application styled with a sleek, glassmorphic dark-mode UI.
- **The Core Reality**: While the landing page and chat headers claim it is powered by "Secure Real-time WebSockets" and "End-to-end simulated encryption", **there is NO backend server, NO database, and NO WebSocket connection**.
- **How Real-time Actually Works**: The application simulates a real-time server using the browser's native `BroadcastChannel` API (`new BroadcastChannel("chitchat_rooms")`). It synchronizes state exclusively across tabs opened in the **same browser on the same device and same origin** (`http://localhost:3000`).

---

## 2. Technology Stack At A Glance

- **Framework**: Next.js `14.2.4` (App Router). All views reside on a single `"use client";` page (`app/page.tsx`).
- **Runtime**: Node.js (`v24.21.0` detected on current machine).
- **UI Library**: React `18.3.1` + React DOM `18.3.1`.
- **Language**: TypeScript `5.9.3` (`strict: true`).
- **Styling**: Tailwind CSS `3.4.19` + PostCSS `8.5.8` + Autoprefixer `10.4.27`.
- **Class Merging**: `clsx: 2.1.1` + `tailwind-merge: 2.6.1` (`cn()` helper in `lib/utils.ts`).
- **Icons**: `lucide-react: 0.378.0`.
- **Real-Time Engine**: Browser `BroadcastChannel` (`lib/socket-mock.ts`).
- **Session Persistence**: Browser `sessionStorage` (`"chitchat_auth"`).
- **Backend / Database**: **None (0 routes, 0 databases)**.
- **Test Suite**: **None (0 tests configured)**.

---

## 3. High-Priority Gotchas & Bugs (MUST KNOW BEFORE EDITING)

### 1. The Broken Tailwind HSL Bug (`BUG-01`)
- In `globals.css`, colors are defined as raw numbers: `--background: 224 71% 4%;`.
- In `tailwind.config.ts`, colors are declared as `background: "var(--background)"`.
- This causes Tailwind to output `background-color: 224 71% 4%;`, which is **invalid CSS syntax**! The browser ignores it and drops the background color.
- **Fix**: Whenever working on styling, wrap theme variables in `hsl(...)`:
  `background: "hsl(var(--background) / <alpha-value>)"`.

### 2. The Ghost Presence Leak (`BUG-02`)
- When a user closes a tab or window, no `LEAVE` event is fired because `socket.leave()` is only called on the manual "Leave Room" button click.
- The user stays stuck in the "Online Users" list of all other open tabs permanently.
- **Fix**: Add a `window.addEventListener("beforeunload", ...)` handler in `app/page.tsx`.

### 3. Missing `animate-shake` Keyframes (`BUG-03`)
- `app/page.tsx:290` references `animate-shake`, but it is not defined in `tailwind.config.ts`. The error message does not shake.

### 4. Monolithic Single-File Component (`DEBT-01`)
- `app/page.tsx` has 449 lines containing the entire application: Landing view, Join modal, Chat screen, Sidebar, Header, Messages list, and Socket listeners.
- Be careful when modifying state; avoid creating re-render loops or breaking the `view` switch (`"landing"` | `"join"` | `"chat"`).

### 5. Windows PowerShell `npm.ps1` Execution Policy
- Running `npm` directly in PowerShell may fail with `PSSecurityException`.
- Always use `npm.cmd` (e.g. `npm.cmd run dev`, `npm.cmd run build`) or execute via cmd/bash.

---

## 4. Key Source Files & Responsibilities

| File Path | Role | Key Exports / Responsibilities |
| :--- | :--- | :--- |
| [`app/layout.tsx`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/layout.tsx) | Root Layout | Configures metadata, dark mode class, and Google Inter font. |
| [`app/globals.css`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/globals.css) | Global Stylesheet | HSL CSS variables, scrollbars, `.glass`, and `.glass-card`. |
| [`app/page.tsx`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx) | Main Controller | Manages state, views (`landing`/`join`/`chat`), form submit, socket effects. |
| [`lib/socket-mock.ts`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/lib/socket-mock.ts) | Real-time Engine | BroadcastChannel wrapper (`join`, `leave`, `sendMessage`, `broadcastPresence`, `on`). |
| [`lib/utils.ts`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/lib/utils.ts) | Helper Utilities | `cn()`, `formatDate()`, and `generateRoomCode()`. |
| [`tailwind.config.ts`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/tailwind.config.ts) | Tailwind Theme | Color mappings, animations (`fade-in`, `slide-up`, `slide-down`). |
| [`next.config.js`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/next.config.js) | Next Config | `reactStrictMode: true`, `swcMinify: false`. |

---

## 5. How Major Features Work

1. **Room Creation**:
   - `handleCreateRoom()` calls `generateRoomCode()` in `lib/utils.ts`.
   - Generates 6 random characters (`[A-Z0-9]`), updates `userInfo.room`, and sets `view = "join"`.
2. **Room Joining**:
   - Form submits in `handleJoinSubmit()`. Validates non-empty name and 6-char room code.
   - Shows loading screen for 800ms (`setTimeout`), saves `{ name, room }` to `sessionStorage`, switches `view = "chat"`, and calls `socket.join(room, name)`.
3. **Session Persistence**:
   - On initial mount, `useEffect` checks `sessionStorage.getItem("chitchat_auth")`.
   - If found, it automatically calls `joinRoom(data.room, data.name)` to bypass the landing screen.
   - **Note**: Messages are NOT persisted in `sessionStorage`; refreshing the page resets the chat feed to empty!
4. **Sending a Message**:
   - `handleSendMessage()` calls `socket?.sendMessage(inputMessage)`.
   - `sendMessage()` assigns a random ID, sets timestamp, broadcasts `{ type: "MESSAGE", room, message }` via `BroadcastChannel`, and dispatches locally.
5. **Presence Tracking**:
   - When Tab B joins, it broadcasts `JOIN`.
   - Tab A receives `JOIN`, adds Tab B to `onlineUsers`, and sends back `PRESENCE`.
   - Tab B receives `PRESENCE` and adds Tab A to `onlineUsers`.

---

## 6. How to Make Changes Safely

1. **Keep Code Typed**: Use TypeScript interfaces from `lib/socket-mock.ts` (`ChatMessage`, `SocketEvent`) and add new interfaces in dedicated type files.
2. **Preserve Tab-Sync Loopback Logic**:
   - Remember that `BroadcastChannel.postMessage()` **does not dispatch to the sender**.
   - If you emit an event that the local user must also see (like a message or leave event), you **must invoke local listeners explicitly** in `SocketMock`.
3. **Do Not Introduce Backend Imports into Client Code**:
   - Avoid importing Node-only modules (like `fs`, `net`, `crypto` without `globalThis.crypto`) into files marked `"use client";`.
4. **Validating Changes**:
   - Test locally by running: `npm.cmd run dev` (or `npm run dev`).
   - Open two browser tabs side-by-side at `http://localhost:3000`.
   - Join the same room in both tabs and verify:
     1. Arrival system message.
     2. Online user count increments to 2.
     3. Messages sent from Tab A appear in Tab B.
     4. Messages sent from Tab B appear in Tab A.

---

## 7. Supporting Reports Directory (`repo-analysis/`)

For exhaustive details on any specific topic, refer to the accompanying reports:
- [PROJECT_OVERVIEW.md](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/repo-analysis/PROJECT_OVERVIEW.md): Executive summary, Git details, setup commands.
- [FILE_MAP.md](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/repo-analysis/FILE_MAP.md): Complete directory tree and per-file responsibility inventory.
- [ARCHITECTURE.md](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/repo-analysis/ARCHITECTURE.md): System architecture, event lifecycles, and Mermaid sequence diagrams.
- [FEATURES.md](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/repo-analysis/FEATURES.md): Deep feature inventory, validation rules, and known limitations.
- [API_AND_DATABASE.md](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/repo-analysis/API_AND_DATABASE.md): Event messaging schemas, storage breakdown, and future database models.
- [SECURITY_AUDIT.md](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/repo-analysis/SECURITY_AUDIT.md): Security findings, cross-room data leak, and input sanitization risks.
- [UI_GUIDE.md](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/repo-analysis/UI_GUIDE.md): Design tokens, glassmorphism CSS, and component refactoring plan.
- [TESTING_AND_DEPLOYMENT.md](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/repo-analysis/TESTING_AND_DEPLOYMENT.md): Build crash diagnosis, PostCSS issue, and deployment constraints.
- [TECHNICAL_DEBT.md](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/repo-analysis/TECHNICAL_DEBT.md): Prioritized bugs, severity matrix, and impact assessment.
- [CHANGE_IMPLEMENTATION_GUIDE.md](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/repo-analysis/CHANGE_IMPLEMENTATION_GUIDE.md): Step-by-step recipes and dependency map.
