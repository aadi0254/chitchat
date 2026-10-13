# ChitChat | Repository Overview & Project Intelligence

## 1. Executive Summary

**ChitChat** is a private, real-time messaging web application styled with a modern, glassmorphic dark-mode user interface. It is architected as a client-side Single Page Application (SPA) running on Next.js 14 (App Router) and TypeScript.

The application allows users to generate or enter a 6-digit alphanumeric room code and communicate in real time across browser tabs. While the user interface states that it is powered by "Secure Real-time WebSockets" with "End-to-end simulated encryption", the actual underlying implementation utilizes the browser's native `BroadcastChannel` API (`new BroadcastChannel("chitchat_rooms")`) to broadcast and synchronize messages and presence events across browsing contexts on the same origin. There is no active backend server, API layer, or database persistence.

---

## 2. Repository & Workspace Identification

| Attribute | Verified Value | Evidence Source |
| :--- | :--- | :--- |
| **Project Name** | `chitchat` | `package.json:2` |
| **Project Version** | `1.0.0` | `package.json:3` |
| **Repository Root (Git)** | `c:\Users\karsh\Desktop\websites-source-codes\chit-chat\chitchat` | `.git` directory location |
| **Workspace Root (IDE)** | `c:\Users\karsh\Desktop\websites-source-codes\chit-chat` | IDE active workspace URI |
| **Git Current Branch** | `main` | `git status` |
| **Current Commit Hash** | `b621418c1464401dc6325897e3efb4125229c3d0` | `git log -n 1` |
| **Latest Commit Message** | `Add files via upload` | `git log -n 1` |
| **Commit Author** | `Aditya Verma <adityaverma25042003@gmail.com>` | `git show b621418` |
| **Commit Date** | `Wed Sep 9 18:59:11 2026 +0530` | `git show b621418` |
| **Remote Origin URL** | `https://github.com/karshtech/chitchat.git` | `git remote -v` |
| **Remote Tracking Status** | Up to date with `origin/main` | `git status` |
| **Working Tree Status** | Clean (prior to `repo-analysis` generation) | `git status` |
| **Repository Tags** | None | `git tag -l` |
| **System Node Version** | `v24.21.0` | `node --version` |
| **System Git Version** | `2.56.0.windows.2` | `git --version` |

---

## 3. Technology Stack Summary

| Layer | Technology | Locked / Specified Version | Responsibility |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `14.2.4` (locked: `14.2.4`) | React application framework, bundling, page routing |
| **UI Library** | React & React DOM | `18.3.1` (locked: `18.3.1`) | Component lifecycle, virtual DOM rendering, hooks |
| **Language** | TypeScript | `^5` (locked: `5.9.3`) | Static type checking and interface contracts |
| **Styling** | Tailwind CSS & PostCSS | Tailwind `3.4.19`, PostCSS `8.5.8` | Utility-first styling with custom CSS custom properties |
| **Vendor CSS Tooling**| Autoprefixer | `10.4.27` | Vendor prefix automation for PostCSS pipeline |
| **Class Utilities** | `clsx` & `tailwind-merge` | `clsx: 2.1.1`, `tailwind-merge: 2.6.1`| Conditional className composition (`cn` helper) |
| **Icons** | Lucide React | `0.378.0` | Vector icon set (PlusCircle, Users, Send, ShieldCheck, etc.) |
| **Real-time Engine** | Browser `BroadcastChannel` | Native Web API | Same-origin inter-tab event broadcasting |
| **Client Storage** | Browser `sessionStorage` | Native Web API | Preserving user handle and room code across refreshes |
| **Linter** | ESLint | `8.57.1`, `eslint-config-next: 14.2.3` | Next.js ESLint configuration |

---

## 4. Key Architectural Patterns

1. **Client-Side Single Page Application (SPA) inside Next.js App Router**:
   - Despite using Next.js 14 App Router (`app/layout.tsx` and `app/page.tsx`), the application does not utilize Server Components, Server Actions, or API Route Handlers.
   - `app/page.tsx` starts with `"use client";` and manages the entire user journey through an internal state machine (`view: "landing" | "join" | "chat"`).

2. **Simulated Real-Time Networking (`lib/socket-mock.ts`)**:
   - The application defines a singleton class `SocketMock` that mimics a WebSocket client interface (`join`, `leave`, `sendMessage`, `broadcastPresence`, `on`).
   - Events are published through a single native `BroadcastChannel` instance named `"chitchat_rooms"`.
   - All browser tabs on the same origin receive all messages and filter by `event.room === this.room`.

3. **Session Authentication & Room Persistence**:
   - Authentication is lightweight and client-local.
   - Upon joining, user credentials (`{ name, room }`) are stored in `sessionStorage.getItem("chitchat_auth")`.
   - On page mount, if existing session data is found, `joinRoom` is automatically invoked.

4. **Monolithic Page Component**:
   - The entire visual interface, form validation, socket listeners, and view switching are located in a single 449-line file: `app/page.tsx`.
   - There is currently no `components/` directory in the repository.

---

## 5. Entry Points & Critical Paths

- **Root Layout**: [`app/layout.tsx`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/layout.tsx)
  - Configures HTML metadata, the `dark` class on the root `<html>` element, and loads the Google Font `Inter`.
- **Global Stylesheet**: [`app/globals.css`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/globals.css)
  - Declares HSL CSS variables for dark-mode tokens, custom scrollbar rules, and glassmorphic utility classes (`.glass`, `.glass-card`).
- **Main View & Controller**: [`app/page.tsx`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx)
  - Orchestrates Landing, Join Room, and Active Chat views.
- **Mock Socket Service**: [`lib/socket-mock.ts`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/lib/socket-mock.ts)
  - Handles publish-subscribe messaging across tabs via `BroadcastChannel`.
- **Utility Helpers**: [`lib/utils.ts`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/lib/utils.ts)
  - Provides `cn()` for class merging, `formatDate()` for time formatting, and `generateRoomCode()` for 6-character room codes.

---

## 6. Setup, Installation & Essential Commands

### Prerequisites
- Node.js: Recommended LTS version (Node 18.x or 20.x; Note: Node v24 requires specific SWC compatibility flags).
- Package Manager: `npm` (or `pnpm` / `yarn`).
- Modern Browser with `BroadcastChannel` support (Chrome, Firefox, Edge, Safari 15.4+).

### Windows PowerShell Execution Policy Note
If running on Windows PowerShell and `npm` errors with:
```powershell
File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled
```
Execute npm commands using the batch wrapper `npm.cmd` or bypass policy:
```powershell
npm.cmd install
npm.cmd run dev
```

### Development Scripts
From the repository root (`chitchat`):
```bash
# 1. Install dependencies
npm install

# 2. Start Turbo development server (default port 3000)
npm run dev

# 3. Build for production
npm run build

# 4. Start production server
npm run start

# 5. Run Next.js linter
npm run lint
```

---

## 7. Known Environment Limitations & Build Gotchas

1. **Missing `node_modules` in Workspace**:
   - The repository currently contains `package.json` and `package-lock.json`, but `node_modules` is not committed or pre-installed. Dependencies must be installed prior to running builds.
2. **Build Error Trace (`build_error.txt`)**:
   - A file named `build_error.txt` exists in the repository root documenting a previous build failure on the original developer's machine (`C:\Users\adity\OneDrive\Desktop\chitchat`).
   - The failure was: `Error: Cannot find module 'autoprefixer'` during `next/font` CSS compilation, caused by an incomplete node_modules directory or OneDrive path synchronization locks.
3. **SWC Minifier Deprecation**:
   - `next.config.js` specifies `swcMinify: false`. Next.js 14 outputs a deprecation warning: `"Disabling SWC Minifer will not be an option in the next major version"`.
4. **Tailwind HSL Token Configuration Defect**:
   - In `tailwind.config.ts`, theme colors are defined as `background: "var(--background)"`.
   - In `globals.css`, `--background: 224 71% 4%;` contains raw HSL components without `hsl()`.
   - As a result, classes like `bg-background` and `text-primary` produce invalid CSS (`background-color: 224 71% 4%;`) unless properly wrapped in `hsl(var(...))`.
