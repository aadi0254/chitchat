# ChitChat | Security & Configuration Audit

## 1. Secrets & Environment Variable Audit

- **Hardcoded Secrets**: **None Detected**.
  - A comprehensive scan of all source files, configurations, and scripts found zero API keys, passwords, database credentials, private keys, or access tokens.
- **Environment Configuration**:
  - No `.env`, `.env.local`, or `.env.example` files exist in the repository.
  - No `process.env` lookups exist in any code file.

---

## 2. Vulnerability & Risk Matrix

| Finding ID | Severity | Category | File Location | Short Description |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **High** | Data Privacy & Isolation | [`lib/socket-mock.ts:27-34`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/lib/socket-mock.ts#L27-L34) | Cross-Room Message Leakage via Shared Origin BroadcastChannel |
| **SEC-02** | **High** | Integrity / Trust | [`app/page.tsx:236, 371`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx#L236) | Misleading UI Claims ("End-to-end simulated encryption" / "WebSockets") |
| **SEC-03** | **Medium**| Authentication | [`app/page.tsx:142-152`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx#L142-L152) | Absence of Identity Verification / User Impersonation |
| **SEC-04** | **Medium**| Input Validation | [`app/page.tsx:142-160`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx#L142-L160) | Unbounded Length for Display Names & Chat Messages |
| **SEC-05** | **Low** | Cryptography | [`lib/socket-mock.ts:69`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/lib/socket-mock.ts#L69) | Predictable Message Identifiers (`Math.random()`) |
| **SEC-06** | **Low** | Access Control | [`lib/utils.ts:16-23`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/lib/utils.ts#L16-L23) | Unauthenticated Public Room Discovery & Guessing |

---

## 3. Detailed Security Findings

### SEC-01: Cross-Room Message Leakage via Shared Origin BroadcastChannel
- **Severity**: **High**
- **Location**: [`lib/socket-mock.ts:27-34`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/lib/socket-mock.ts#L27-L34)
- **Vulnerability Description**:
  The application instantiates a single broadcast channel named `"chitchat_rooms"` across the entire origin:
  ```ts
  this.channel = new BroadcastChannel("chitchat_rooms");
  this.channel.onmessage = (event) => {
    const data = event.data as SocketEvent;
    if (data.room === this.room) {
      this.listeners.forEach(listener => listener(data));
    }
  };
  ```
  Because messages for all rooms are published to this shared channel, any other script, browser extension, or open tab on the same origin can subscribe to `"chitchat_rooms"` and inspect all chat messages, usernames, and room codes across the entire application in cleartext.
- **Impact**: Room traffic is not isolated at the transport level. Filtering is purely cosmetic at the receiver end.
- **Remediation**:
  Scope the channel name dynamically to the specific room code:
  ```ts
  this.channel = new BroadcastChannel(`chitchat_room_${room}`);
  ```

---

### SEC-02: Misleading Security Claims in User Interface
- **Severity**: **High** (Integrity & Compliance)
- **Location**: [`app/page.tsx:236, 371`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx#L236)
- **Vulnerability Description**:
  The UI displays:
  - Line 236: `"Powered by Secure Real-time WebSockets"`
  - Line 371: `"End-to-end simulated encryption active"`
  In reality, there are no WebSockets (it uses `BroadcastChannel`), and there is zero encryption (data is transmitted as plain JavaScript objects in browser memory).
- **Impact**: Gives users a false sense of security regarding the privacy of their communications.
- **Remediation**:
  Update UI copy to accurately state: `"Local Tab Synchronization (Demo Mode)"`, or implement genuine TLS-backed WebSockets with Web Crypto API encryption if real E2EE is desired.

---

### SEC-03: Lack of User Authentication & Impersonation Risk
- **Severity**: **Medium**
- **Location**: [`app/page.tsx:142-152`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx#L142-L152)
- **Vulnerability Description**:
  Users join by simply entering a display name. There are no passwords, user IDs, or session tokens. Any user can join a room using another active user's exact name.
- **Impact**:
  An attacker or peer can impersonate another user in the chat room. Because message bubbles evaluate ownership via `msg.sender === userInfo.name`, if two users have the same name, both users will see all messages from both tabs as their own.
- **Remediation**:
  Generate an ephemeral unique user ID (`nanoid()` or `crypto.randomUUID()`) upon joining and identify messages by `senderId` rather than display name alone.

---

### SEC-04: Missing Input Sanitization & Unbounded Message Length
- **Severity**: **Medium**
- **Location**: [`app/page.tsx:142-160`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/page.tsx#L142-L160)
- **Vulnerability Description**:
  The only validation on input text is `!inputMessage.trim()` and `!userInfo.name.trim()`. There are no maximum character limits enforced on either field.
- **Impact**:
  A user can paste a 100,000-character payload into the chat or display name. This can result in:
  1. High memory consumption in other open tabs.
  2. Horizontal layout breaking and rendering lag.
  3. UI freeze during React re-renders.
- **Remediation**:
  Enforce explicit length limits (e.g. `maxLength={30}` for display names and `maxLength={1000}` for messages) in both the `<input>` elements and submit handlers.

---

### SEC-05: Non-Cryptographic Random Identifier Generation
- **Severity**: **Low**
- **Location**: [`lib/socket-mock.ts:69`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/lib/socket-mock.ts#L69), [`lib/utils.ts:16-23`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/lib/utils.ts#L16-L23)
- **Vulnerability Description**:
  Identifiers are generated using `Math.random()`:
  - Message IDs: `Math.random().toString(36).substring(2, 11)`
  - Room codes: `chars.charAt(Math.floor(Math.random() * chars.length))`
- **Impact**: `Math.random()` is PRNG-based and predictable. Over prolonged usage, message ID collisions can occur.
- **Remediation**:
  Use `crypto.randomUUID()` for message IDs and `crypto.getRandomValues()` for room codes.
