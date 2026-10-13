# ChitChat | Feature Inventory & Implementation Analysis

## 1. Feature Matrix Overview

| Feature ID | Feature Name | Primary Files | Implementation Status | Scope / Reach |
| :--- | :--- | :--- | :--- | :--- |
| **FEAT-01** | Random 6-Digit Room Generation | `lib/utils.ts`, `app/page.tsx` | Verified Working | Client-side only |
| **FEAT-02** | Room Joining & Input Validation | `app/page.tsx` | Partially Implemented (Weak Regex/Length) | Client-side only |
| **FEAT-03** | Real-Time Cross-Tab Messaging | `lib/socket-mock.ts`, `app/page.tsx` | Verified Working (Same Origin Only) | In-memory BroadcastChannel |
| **FEAT-04** | Session Persistence & Auto-Rejoin | `app/page.tsx` | Verified Working (No Message History) | Browser `sessionStorage` |
| **FEAT-05** | Real-Time Presence & Online Users | `lib/socket-mock.ts`, `app/page.tsx` | Partially Implemented (Ghost on Close)| In-memory BroadcastChannel |
| **FEAT-06** | Room Code Clipboard Sharing | `app/page.tsx` | Verified Working | Browser Clipboard API |

---

## 2. In-Depth Feature Breakdown

### FEAT-01: Random 6-Digit Room Generation

- **Purpose**: Generates a quick, random room code for users who click "Create a Room".
- **User-Facing Behavior**:
  1. User clicks the "Create a Room" card on the landing view.
  2. A random 6-character alphanumeric code is generated.
  3. The user is transitioned to the "Access Room" form with the room code already pre-filled.
- **Entry Points & Code**:
  - Generator: [`lib/utils.ts:16-23`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/lib/utils.ts#L16-L23) (`generateRoomCode()`).
  - Handler: [`app/page.tsx:132-136`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx#L132-L136) (`handleCreateRoom()`).
- **Implementation Mechanism**:
  ```ts
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
  ```
- **Backend / Database Involvement**: None.
- **Status**: **Verified Working**.
- **Limitations**: Uses `Math.random()`, which is not cryptographically secure. Does not verify whether a room code is already active or collided.
- **Extension Points**: To enforce cryptographic uniqueness or backend-managed rooms, edit `lib/utils.ts` and connect with a backend endpoint.

---

### FEAT-02: Room Joining & Form Validation

- **Purpose**: Validates user inputs (display name and room code) before transitioning into the chat room.
- **User-Facing Behavior**:
  1. User inputs a display name (e.g., "Alex") and a 6-character room code.
  2. Submits the form via "Enter Chat Room" button or Enter key.
  3. If invalid, an inline red error message appears.
  4. If valid, an 800ms loading spinner ("Entering Secure Room...") appears before loading the chat view.
- **Entry Points & Code**:
  - Form UI: [`app/page.tsx:243-301`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx#L243-L301).
  - Validation Handler: [`app/page.tsx:138-152`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx#L138-L152) (`handleJoinSubmit()`).
- **Validation Rules**:
  - `!userInfo.name.trim()` -> Rejects empty names.
  - `!userInfo.room.trim() || userInfo.room.length !== 6` -> Requires non-empty string of exactly 6 characters.
  - Automatically converts room input to uppercase (`e.target.value.toUpperCase()`).
- **Status**: **Partially Implemented**.
- **Limitations & Flaws**:
  - No regex validation: Accepts arbitrary symbols (e.g. `!@#$%^`).
  - No maximum character length on display name: A 1,000-character name passes validation.
  - Duplicate name collision: Two users in the same room can have the exact same name, breaking differentiation.
  - Error shake animation: The CSS class `animate-shake` on line 290 is undefined in `tailwind.config.ts`, so no animation triggers.
- **Extension Points**: Modify `handleJoinSubmit` in `app/page.tsx` and add regex validation `/^[A-Z0-9]{6}$/`.

---

### FEAT-03: Real-Time Cross-Tab Messaging

- **Purpose**: Synchronizes instant chat messages across open tabs in real time.
- **User-Facing Behavior**:
  1. User types a message into the footer input field and clicks Send (or presses Enter).
  2. Message immediately appears in the chat feed aligned to the right with primary purple background.
  3. The other open tabs in the same room receive the message in real time, aligned to the left with accent background.
  4. The feed smoothly scrolls to the bottom.
- **Entry Points & Code**:
  - Socket Mock: [`lib/socket-mock.ts:65-81`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/lib/socket-mock.ts#L65-L81) (`sendMessage()`).
  - Component Listener: [`app/page.tsx:50-97`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx#L50-L97) (`useEffect`).
  - Feed Rendering: [`app/page.tsx:376-420`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx#L376-L420).
- **Data Model**:
  ```ts
  interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: number;
    type: "chat" | "system";
  }
  ```
- **Status**: **Verified Working (within same-origin browser contexts)**.
- **Limitations & Flaws**:
  - Messages exist solely in volatile React state (`messages` array). If a tab is refreshed, all messages disappear.
  - Joining late means zero message history: A user joining an active room cannot see earlier messages.
  - No encryption or backend delivery guarantee: Any script on the origin can read all channel events.
- **Extension Points**: Replace `SocketMock` in `lib/socket-mock.ts` with a true WebSocket client (e.g., Socket.IO or native WebSocket).

---

### FEAT-04: Session Persistence & Auto-Rejoin

- **Purpose**: Allows users to refresh their browser tab without being kicked out to the landing page.
- **User-Facing Behavior**:
  1. When a user is in a chat room and presses F5 / browser reload, the page re-renders.
  2. The loading spinner is briefly displayed.
  3. The user is automatically returned to the chat view with their room and name restored.
- **Entry Points & Code**:
  - Storage Write: [`app/page.tsx:109`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx#L109) (`sessionStorage.setItem("chitchat_auth", JSON.stringify({ name, room }))`).
  - Mount Read: [`app/page.tsx:40-47`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx#L40-L47) (`useEffect`).
  - Storage Removal: [`app/page.tsx:171`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx#L171) (`sessionStorage.removeItem("chitchat_auth")` on Leave).
- **Status**: **Verified Working**.
- **Limitations & Flaws**:
  - Only credentials (`name`, `room`) are preserved. All previous messages are lost upon reload.
  - `JSON.parse` is not wrapped in `try/catch`: Malformed `sessionStorage` crashes the component on mount.
- **Extension Points**: Wrap `JSON.parse` in `try/catch` and optionally persist recent message history in `sessionStorage` or `IndexedDB`.

---

### FEAT-05: Real-Time Presence & Online Users Roster

- **Purpose**: Displays the active member list and a live counter of participants in the room sidebar.
- **User-Facing Behavior**:
  1. When entering, the user sees themselves in the "Online Users" list with a green pulsating status dot.
  2. When another tab joins, that user appears in the list and a system message announces their arrival.
  3. When a user clicks the "Leave Room" button, they are removed from the roster and a departure system message appears.
- **Entry Points & Code**:
  - Handshake Broadcast: [`lib/socket-mock.ts:59-63`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/lib/socket-mock.ts#L59-L63) (`broadcastPresence()`).
  - Event Dispatch: [`app/page.tsx:59-91`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx#L59-L91) (`JOIN`, `PRESENCE`, `LEAVE`).
  - Sidebar UI: [`app/page.tsx:336-359`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx#L336-L359).
- **Status**: **Partially Implemented (Presence Leak on Tab Close)**.
- **Critical Flaw**:
  - If a user closes their tab or browser window instead of clicking the red "Leave Room" button, no `LEAVE` event is fired.
  - That user remains in the online user list of all other tabs indefinitely until those tabs are refreshed.
- **Extension Points**: Add a `window.addEventListener("beforeunload", ...)` handler in `app/page.tsx` to automatically invoke `socket?.leave()` when the tab closes.

---

### FEAT-06: Room Code Clipboard Sharing

- **Purpose**: Enables rapid 1-click copying of the 6-digit room code for sharing with peers.
- **User-Facing Behavior**:
  1. In the sidebar under "Room Code", the user clicks the copy icon.
  2. The code is written to the system clipboard.
  3. The copy icon immediately morphs into a green checkmark icon for 2 seconds.
- **Entry Points & Code**:
  - Handler: [`app/page.tsx:163-167`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx#L163-L167) (`copyCode()`).
  - Button UI: [`app/page.tsx:326-332`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx#L326-L332).
- **Implementation Mechanism**:
  ```ts
  navigator.clipboard.writeText(userInfo.room);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
  ```
- **Status**: **Verified Working**.
- **Limitations**: Does not handle promise rejections from `navigator.clipboard.writeText()` if clipboard permissions are blocked or in non-secure HTTP contexts.
- **Extension Points**: Wrap in `.catch()` and provide fallback via `document.execCommand("copy")`.
