# ChitChat | Technical Debt & Change Impact Analysis

## 1. Executive Debt Summary

The ChitChat codebase is a compact, high-potential prototype. However, it currently suffers from several critical styling defects, state synchronization bugs, architectural coupling, and missing production foundations (tests, modularity, real networking).

---

## 2. Prioritized Technical Debt & Bug Inventory

### BUG-01: Broken Tailwind Color Theme Configuration
- **Severity**: **High**
- **Confidence Level**: Verified (Confirmed via `public/test.css` inspection)
- **File & Lines**: [`tailwind.config.ts:11-33`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/tailwind.config.ts#L11-L33) & [`app/globals.css:5-26`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/globals.css#L5-L26)
- **Code Evidence**:
  In `globals.css`:
  ```css
  --primary: 263.4 70% 50.4%;
  --background: 224 71% 4%;
  ```
  In `tailwind.config.ts`:
  ```ts
  colors: {
    background: "var(--background)",
    primary: { DEFAULT: "var(--primary)" },
  }
  ```
- **Likely Impact**: Tailwind compiles classes like `.bg-background` to `background-color: var(--background);`, resolving in CSS to `background-color: 224 71% 4%;`. This is invalid CSS syntax, causing browsers to drop color properties and render transparent/default backgrounds.
- **Remediation**:
  Wrap all CSS variable references in `hsl(var(...) / <alpha-value>)` inside `tailwind.config.ts`.
- **Features Affected**: Entire UI appearance, buttons, cards, text, and chat bubbles.

---

### BUG-02: Ghost Presence & Memory Leak on Passive Tab Close
- **Severity**: **High**
- **Confidence Level**: Verified (Code audit of `app/page.tsx` and `lib/socket-mock.ts`)
- **File & Lines**: [`app/page.tsx:169-176`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx#L169-L176), [`lib/socket-mock.ts:47-57`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/lib/socket-mock.ts#L47-L57)
- **Code Evidence**:
  `socket.leave()` is only invoked inside `leaveRoom()`, which is exclusively bound to the manual "Leave Room" button click.
  There is no `beforeunload` or `unload` window event listener registered in `page.tsx`.
- **Likely Impact**: If a user simply closes their browser tab or navigates away, no `LEAVE` event is transmitted. That user remains in the online user list of all other open tabs permanently.
- **Remediation**:
  Add a `beforeunload` listener inside `useEffect` in `app/page.tsx`:
  ```ts
  useEffect(() => {
    const handleBeforeUnload = () => { socket?.leave(); };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => { window.removeEventListener("beforeunload", handleBeforeUnload); };
  }, []);
  ```
- **Features Affected**: FEAT-05 (Presence Tracking & Online Users).

---

### BUG-03: Undefined `animate-shake` Animation Class
- **Severity**: **Medium**
- **Confidence Level**: Verified
- **File & Lines**: [`app/page.tsx:290`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx#L290), [`tailwind.config.ts:39-57`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/tailwind.config.ts#L39-L57)
- **Code Evidence**:
  Line 290 in `app/page.tsx`:
  ```tsx
  {error && <p className="text-red-400 text-sm animate-shake">{error}</p>}
  ```
  `animate-shake` is not declared anywhere in `tailwind.config.ts` or `globals.css`.
- **Likely Impact**: Validation error messages appear statically without the intended shake feedback.
- **Remediation**:
  Add `shake` keyframes and animation in `tailwind.config.ts`:
  ```ts
  keyframes: {
    shake: {
      "0%, 100%": { transform: "translateX(0)" },
      "20%, 60%": { transform: "translateX(-4px)" },
      "40%, 80%": { transform: "translateX(4px)" },
    }
  },
  animation: {
    shake: "shake 0.4s ease-in-out",
  }
  ```
- **Features Affected**: FEAT-02 (Room Joining & Validation).

---

### DEBT-01: Monolithic Single-File Component Architecture
- **Severity**: **High**
- **Confidence Level**: Verified
- **File & Lines**: [`app/page.tsx`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx) (449 lines)
- **Description**: The entire application (Landing view, Join room modal, Chat view, Sidebar, Header, Messages list, Message bubbles, Form inputs, and socket hooks) is crammed into a single component.
- **Likely Impact**: High cognitive complexity, high probability of regression during edits, impossible to unit test individual UI elements in isolation.
- **Remediation**:
  Decompose `page.tsx` into modular components under `components/` (`LandingView`, `JoinModal`, `ChatSidebar`, `MessageList`, `MessageBubble`, `ChatInput`).
- **Features Affected**: All features.

---

### DEBT-02: Total Absence of Message History & Refresh Persistence
- **Severity**: **High**
- **Confidence Level**: Verified
- **File & Lines**: [`app/page.tsx:30, 40-47`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx#L30)
- **Description**: Messages are kept only in a volatile React state array `messages`. When a user refreshes the page or a new user enters, existing messages are completely missing.
- **Likely Impact**: Degraded chat experience; users lose their entire conversation history on accidental reload.
- **Remediation**:
  Cache recent messages in `sessionStorage` or request past message state from active peers via a `SYNC_REQUEST` / `SYNC_RESPONSE` event pair.
- **Features Affected**: FEAT-03 (Real-Time Messaging), FEAT-04 (Session Persistence).

---

### DEBT-03: Shared BroadcastChannel Cross-Room Traffic Crosstalk
- **Severity**: **Medium**
- **Confidence Level**: Verified
- **File & Lines**: [`lib/socket-mock.ts:27-34`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/lib/socket-mock.ts#L27-L34)
- **Description**: All rooms share the exact same channel `"chitchat_rooms"`.
- **Likely Impact**: As user activity scales, every tab receives events for every other active room and must filter them out in JavaScript, creating unnecessary CPU wakeups and data exposure.
- **Remediation**:
  Instantiate room-specific channels: `new BroadcastChannel("chitchat_room_" + room)`.
- **Features Affected**: FEAT-03, FEAT-05.

---

### DEBT-04: Arbitrary Timeouts with Unmounted State Hazard
- **Severity**: **Medium**
- **Confidence Level**: Verified
- **File & Lines**: [`app/page.tsx:106, 115`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx#L106)
- **Description**: Nested `setTimeout(..., 800)` and `setTimeout(..., 50)` are used without cancellation references (`useRef` or cleanup in `useEffect`).
- **Likely Impact**: Can trigger "Can't perform a React state update on an unmounted component" warnings if the user navigates away during the simulated 800ms loading phase.
- **Remediation**:
  Track timeout IDs in a `useRef` and clear them on component unmount.
- **Features Affected**: FEAT-02, FEAT-04.

---

### DEBT-05: Unreferenced Build Artifacts Committed to Repository
- **Severity**: **Low**
- **Confidence Level**: Verified
- **Files**:
  - `public/test.css` (25,665 bytes, unreferenced standalone Tailwind compilation)
  - `build_error.txt` (5,168 bytes, crash dump from developer machine)
  - `tsconfig.tsbuildinfo` (80,882 bytes, TypeScript cache)
- **Description**: Artifacts from previous local debug sessions were committed directly via web upload ("Add files via upload").
- **Remediation**:
  Add `*.tsbuildinfo`, `build_error.txt`, and orphan test files to `.gitignore` and delete them when cleanups are authorized.
