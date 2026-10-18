# ChitChat — Architecture & Working Document

> **Private, Real-Time, Ephemeral Messenger**
> Built with Next.js 14 · Socket.IO · Node.js · Tailwind CSS

---

## 1. System Overview

ChitChat is a **real-time, ephemeral chat application** where conversations exist exclusively in server memory. There is **no database** — all messages, participants, and room state are destroyed the moment the last user leaves or the room is explicitly closed.

### Core Design Principles

| Principle | Implementation |
|:---|:---|
| **Ephemeral by Default** | All data lives in-memory (`Map` objects); zero disk persistence |
| **Server-Authoritative** | All validation (room codes, names, message length, rate limits) enforced server-side |
| **Reconnection-Resilient** | 15-second grace period preserves session on network interruptions/page refresh |
| **Instance-Isolated** | Reusing a room code after destruction creates a completely fresh room (unique `instanceId`) |
| **Zero-Config Local Dev** | Unified mode runs frontend + backend on a single port |

---

## 2. Technology Stack

```mermaid
graph TB
    subgraph Frontend["Frontend (Browser)"]
        NEXT["Next.js 14 (App Router)"]
        REACT["React 18"]
        TW["Tailwind CSS 3"]
        LUCIDE["Lucide React Icons"]
        SIOC["socket.io-client"]
    end

    subgraph Backend["Backend (Node.js)"]
        HTTP["HTTP Server (node:http)"]
        SIO["Socket.IO Server"]
        RM["RoomManager"]
        SH["Socket Handlers"]
    end

    SIOC <-->|"WebSocket / Polling"| SIO
    NEXT -->|"SSR / CSR"| HTTP
    SIO --> SH --> RM
```

| Layer | Technology | Version |
|:---|:---|:---|
| Framework | Next.js (App Router, Turbopack dev) | ^14.2.4 |
| UI | React + Lucide React | ^18.3.1 / ^0.378.0 |
| Styling | Tailwind CSS + `clsx` + `tailwind-merge` | ^3.4.1 |
| Realtime | Socket.IO (server + client) | ^4.8.4 |
| Runtime | Node.js | v18+ |
| Language | TypeScript (frontend) / JavaScript (backend) | ^5 |

---

## 3. Project File Structure

```
chitchat/
├── server.js                    # Entry point — boots unified or standalone server
├── server/
│   ├── index.js                 # createRealtimeServer() factory
│   ├── room-manager.js          # RoomManager class — all room/participant state
│   └── socket-handlers.js       # registerSocketHandlers() — event routing
├── app/
│   ├── layout.tsx               # Root layout (Inter font, dark mode, metadata)
│   ├── page.tsx                 # Single-page app (Landing → Join → Chat views)
│   └── globals.css              # CSS variables, glassmorphism, custom scrollbar
├── lib/
│   ├── socket.ts                # RealSocketClient singleton (socket.io-client wrapper)
│   ├── socket-mock.ts           # Mock for testing/SSR
│   └── utils.ts                 # cn(), formatDate(), generateRoomCode()
├── types/
│   └── chat.ts                  # Shared TypeScript interfaces & union types
├── test/
│   ├── realtime-integration.test.js   # End-to-end Socket.IO integration tests
│   └── room-manager.test.js           # Unit tests for RoomManager
├── public/                      # Static assets
├── .env.example                 # Environment variable documentation
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind theme extensions
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Scripts, dependencies
```

---

## 4. Architecture Diagram

```mermaid
flowchart TD
    subgraph Client["Browser (React SPA)"]
        LP["Landing Page"]
        JF["Join Form"]
        CV["Chat View"]
        SC["RealSocketClient\n(Singleton)"]
    end

    subgraph Server["Node.js Server"]
        EP["server.js\n(Entry Point)"]
        CR["createRealtimeServer()"]
        IO["Socket.IO Server"]
        SH["registerSocketHandlers()"]
        RM["RoomManager"]
    end

    subgraph State["In-Memory State (Maps)"]
        RBC["roomsByCode\nMap<code, RoomInstance>"]
        RBI["roomsByInstanceId\nMap<uuid, RoomInstance>"]
        STR["socketToRoomCode\nMap<socketId, code>"]
    end

    subgraph Room["RoomInstance"]
        PARTS["participants\nMap<pid, Participant>"]
        MSGS["messages[]\nChatMessage[]"]
        S2P["socketToParticipant\nMap<socketId, pid>"]
        DT["disconnectTimers\nMap<pid, Timer>"]
        RL["rateLimits\nMap<pid, RateInfo>"]
    end

    LP -->|"Create Room"| JF
    LP -->|"Join Room"| JF
    JF -->|"Submit"| SC
    SC <-->|"WebSocket"| IO
    IO --> SH
    SH --> RM
    RM --> RBC
    RM --> RBI
    RM --> STR
    RBC --> Room
    CV <-->|"Events"| SC
```

---

## 5. Server Architecture (Deep Dive)

### 5.1 Entry Point — `server.js`

The entry point supports **two runtime modes**:

| Mode | When | Behavior |
|:---|:---|:---|
| **Unified** (default) | `STANDALONE ≠ "true"` | Boots Next.js SSR + Socket.IO on a single HTTP server (port 3000) |
| **Standalone** | `STANDALONE = "true"` or `--standalone` flag | Runs Socket.IO backend only (port 3001), Next.js served separately |

```mermaid
flowchart LR
    Start["node server.js"] --> Check{STANDALONE?}
    Check -->|No| Unified["Next.js + Socket.IO\non port 3000"]
    Check -->|Yes| Standalone["Socket.IO only\non port 3001"]
    Unified -->|Fallback on error| Standalone
```

**Unified mode** also exposes:
- `GET /health` — JSON health check with uptime
- `GET /api/rooms/:code` — Diagnostic room inspection (never exposes message content)

### 5.2 Server Factory — `server/index.js`

`createRealtimeServer(options)` returns an object with:

```javascript
{
  httpServer,    // node:http server
  io,            // Socket.IO Server instance
  roomManager,   // RoomManager instance
  listen(port, hostname),  // → Promise<actualPort>
  close()        // → Promise<void> (graceful shutdown)
}
```

**Socket.IO Configuration:**
- Transports: `["websocket", "polling"]` (WebSocket primary, long-polling fallback)
- Ping timeout: 20s, Ping interval: 10s
- CORS: configurable via `CORS_ORIGIN` env var

### 5.3 Room Manager — `server/room-manager.js`

The `RoomManager` class is the **core state engine**. It owns all in-memory data and enforces every business rule.

#### Data Model

```mermaid
erDiagram
    RoomManager ||--o{ RoomInstance : "manages (by code & instanceId)"
    RoomManager ||--o{ SocketMapping : "tracks (socketId → roomCode)"
    RoomInstance ||--o{ Participant : "contains"
    RoomInstance ||--o{ ChatMessage : "stores"
    RoomInstance ||--o{ DisconnectTimer : "holds"
    RoomInstance ||--o{ RateLimit : "enforces"

    RoomInstance {
        string code "6-char e.g. ABC123"
        string instanceId "UUID v4"
        number createdAt "epoch ms"
        string status "active | closing | closed"
    }

    Participant {
        string id "UUID v4"
        string name "display name"
        string socketId "current socket"
        number joinedAt "epoch ms"
        boolean isOnline "presence flag"
    }

    ChatMessage {
        string id "UUID v4"
        string sender "display name"
        string senderId "participant UUID"
        string text "message body"
        number timestamp "epoch ms"
        string type "chat | system"
        string room "room code"
    }
```

#### Key Methods

| Method | Purpose |
|:---|:---|
| `normalizeRoomCode(code)` | Validates `^[A-Z0-9]{6}$`, uppercases, trims |
| `normalizeDisplayName(name)` | Validates non-empty, ≤ 30 chars |
| `getOrCreateRoom(code)` | Returns existing active room or creates fresh instance |
| `joinRoom(code, name, socketId, pid?)` | Joins or reconnects participant; cancels disconnect timer on reconnect |
| `sendMessage(socketId, text, clientMsgId?)` | Validates, rate-limits, stores message in room array |
| `handleSocketDisconnect(socketId, cb)` | Sets participant offline, starts 15s grace timer |
| `leaveRoom(socketId)` | Immediate removal; destroys room if last participant |
| `destroyRoom(instanceId)` | **Complete ephemeral purge** — clears all data, removes all references |

#### Validation Rules (Server-Enforced)

| Rule | Constraint |
|:---|:---|
| Room code format | `^[A-Z0-9]{6}$` |
| Display name length | 1–30 characters |
| Message length | 1–1,000 characters |
| Rate limit | 10 messages per 1,000ms window per participant |
| Disconnect grace | 15,000ms before participant removal |

### 5.4 Socket Event Handlers — `server/socket-handlers.js`

`registerSocketHandlers(io, roomManager)` maps Socket.IO events to `RoomManager` operations:

#### Event Flow Table

| Client Event | Server Handler | Server Emits | Recipients |
|:---|:---|:---|:---|
| `join_room` | `roomManager.joinRoom()` | `room_joined` (ack) + `user_joined` / `presence_update` + system `message` | Sender (ack) + Room peers |
| `send_message` | `roomManager.sendMessage()` | `message` | All room members |
| `leave_room` | `roomManager.leaveRoom()` | `user_left` + system `message` | Room peers |
| `close_room` | `roomManager.destroyRoom()` | `room_closed` | All room members |
| `disconnect` | `roomManager.handleSocketDisconnect()` | `user_left` + system `message` (after 15s grace) | Room peers |

---

## 6. Frontend Architecture (Deep Dive)

### 6.1 Application Structure

The frontend is a **single-page application** within Next.js App Router, using a single `page.tsx` component that manages three view states:

```mermaid
stateDiagram-v2
    [*] --> Landing
    Landing --> Join: "Create Room" or "Join Room"
    Join --> Landing: "← Back"
    Join --> Loading: Submit form
    Loading --> Chat: Join success
    Loading --> Join: Join error
    Chat --> Landing: Leave room
    Chat --> Landing: Room closed
```

#### View States

| State | Description | Key UI |
|:---|:---|:---|
| **`landing`** | Home screen with branding | "Create a Room" + "Join a Room" cards |
| **`join`** | Credential entry form | Display name + Room code inputs |
| **`chat`** | Active chat interface | Sidebar (participants) + Message area + Input bar |

### 6.2 Socket Client — `lib/socket.ts`

`RealSocketClient` is a **singleton** class exported as `socket`. It wraps `socket.io-client` with:

- **Auto-reconnection**: Up to 10 attempts with 1–5s exponential backoff
- **Session persistence**: `participantId` stored in `sessionStorage` (`chitchat_pid`)
- **Transparent re-join**: On reconnect, automatically re-emits `join_room` with saved `participantId`
- **Observer pattern**: `on(listener)` returns an unsubscribe function

#### Client API

| Method | Returns | Purpose |
|:---|:---|:---|
| `join(room, user)` | `Promise<RoomJoinedResponse>` | Connect + join room (8s timeout) |
| `leave()` | `Promise<void>` | Explicit leave + cleanup |
| `sendMessage(text)` | `Promise<{success, messageId?, error?}>` | Send with 5s delivery timeout |
| `closeRoom()` | `Promise<void>` | Host closes the entire room |
| `on(listener)` | `() => void` (unsubscribe) | Register event listener |
| `getUser() / getRoom() / getParticipantId()` | `string \| null` | State getters |

#### Event Types Dispatched to Listeners

| Event Type | Data | Trigger |
|:---|:---|:---|
| `MESSAGE` | `{ room, message: ChatMessage }` | New chat or system message |
| `ROSTER` | `{ room, users: RoomParticipant[] }` | Full participant list update |
| `JOIN` | `{ room, user, participant? }` | Someone joined |
| `LEAVE` | `{ room, user, participantId? }` | Someone left |
| `PRESENCE` | `{ room, user, participant? }` | Reconnection presence update |
| `ROOM_CLOSED` | `{ room, reason }` | Room was closed by host |
| `ERROR` | `{ room?, error }` | Server error |

### 6.3 TypeScript Types — `types/chat.ts`

Shared type definitions used by both frontend and referenced by backend via JSDoc:

- `ChatMessage` — Message payload (id, sender, text, timestamp, type, room)
- `RoomParticipant` — Participant metadata
- `SocketEvent` — Discriminated union of all client-side events

### 6.4 UI Design System

Defined in `globals.css` with HSL CSS variables:

| Token | HSL Value | Usage |
|:---|:---|:---|
| `--background` | `224 71% 4%` | Deep navy page background |
| `--foreground` | `213 31% 91%` | Light text |
| `--primary` | `263.4 70% 50.4%` | Vibrant purple (buttons, accents, sent messages) |
| `--secondary` | `222.2 47.4% 11.2%` | Dark card backgrounds |
| `--accent` | `217.2 32.6% 17.5%` | Input fields, received messages |

Custom classes: `.glass` (glassmorphism panels), `.glass-card` (sidebar), custom scrollbar styling.

---

## 7. Complete Message Lifecycle

```mermaid
sequenceDiagram
    participant A as User A (Browser)
    participant SC as Socket Client
    participant SIO as Socket.IO Server
    participant SH as Socket Handlers
    participant RM as RoomManager
    participant B as User B (Browser)

    A->>SC: sendMessage("Hello!")
    SC->>SIO: emit("send_message", {text: "Hello!"})
    SIO->>SH: on("send_message") handler
    SH->>RM: sendMessage(socketId, "Hello!")
    RM->>RM: Validate text (non-empty, ≤1000 chars)
    RM->>RM: Check rate limit (≤10/sec)
    RM->>RM: Create ChatMessage object
    RM->>RM: Push to room.messages[]
    RM-->>SH: Return ChatMessage
    SH->>SIO: io.to(roomCode).emit("message", msg)
    SIO->>A: message event (echo back)
    SIO->>B: message event (broadcast)
    SH-->>SC: callback({success: true, messageId})
    SC-->>A: Promise resolves
    A->>A: Clear input field
```

---

## 8. Room Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created: getOrCreateRoom(code)
    Created --> Active: First participant joins

    state Active {
        [*] --> Chatting
        Chatting --> Chatting: Messages sent/received
        Chatting --> GracePeriod: Participant disconnects
        GracePeriod --> Chatting: Reconnects within 15s
        GracePeriod --> ParticipantRemoved: Grace expires
        ParticipantRemoved --> Chatting: Other participants remain
    }

    Active --> Destroyed: Last participant leaves
    Active --> Destroyed: closeRoom() called
    Active --> Destroyed: Grace expires + room empty
    Destroyed --> [*]: All Maps cleared, arrays emptied

    note right of Destroyed
        destroyRoom() performs:
        • status = "closed"
        • Cancel all disconnect timers
        • Delete from roomsByCode
        • Delete from roomsByInstanceId
        • Clear participants, messages,
          socketToParticipant, rateLimits
    end note
```

### Instance Isolation Guarantee

When room `ABC123` is destroyed and a new user later joins `ABC123`:
1. `getOrCreateRoom("ABC123")` finds no active room (old was deleted)
2. Creates a **brand new `RoomInstance`** with a fresh `instanceId` (UUID)
3. Old messages, participants, and state are **permanently gone** — no bleed-through

---

## 9. Reconnection Flow

```mermaid
sequenceDiagram
    participant User as User (Browser)
    participant SC as Socket Client
    participant SIO as Socket.IO
    participant RM as RoomManager

    Note over User: Network drops / Page refresh
    User->>SC: Connection lost
    SC->>SIO: disconnect event
    SIO->>RM: handleSocketDisconnect(socketId)
    RM->>RM: participant.isOnline = false
    RM->>RM: Start 15s grace timer
    RM->>SIO: Broadcast presence_update (offline)

    Note over User: Within 15 seconds...
    User->>SC: Reconnects (auto or manual)
    SC->>SIO: connect event
    SC->>SIO: emit("join_room", {participantId: saved_pid})
    SIO->>RM: joinRoom() — finds existing participant
    RM->>RM: Cancel grace timer
    RM->>RM: participant.isOnline = true
    RM->>RM: Update socketId mapping
    RM-->>SIO: Return {isReconnect: true}
    SIO->>User: room_joined (with full message history)
    SIO->>SIO: Broadcast presence_update (online)
```

**Key Detail:** The `participantId` is persisted in `sessionStorage` (key: `chitchat_pid`), surviving page refreshes but not tab closes. Room/name info is stored in `chitchat_auth`.

---

## 10. Deployment Topology

```mermaid
graph TB
    subgraph Production["Production Deployment"]
        subgraph Vercel["Vercel (Serverless)"]
            NX["Next.js Frontend\n(Static + SSR)"]
        end
        subgraph PersistentHost["Render / Railway / Fly.io"]
            BK["Node.js Backend\n(server.js --standalone)"]
        end
        NX <-->|"NEXT_PUBLIC_SOCKET_URL"| BK
    end

    subgraph LocalUnified["Local Development (Unified)"]
        UNI["node server.js\nPort 3000"]
        UNI --- NX2["Next.js"] & SIO2["Socket.IO"]
    end

    subgraph LocalSplit["Local Development (Split)"]
        DEV["npm run dev\nPort 3000"]
        STD["npm run server:standalone\nPort 3001"]
        DEV <-->|"NEXT_PUBLIC_SOCKET_URL=\nlocalhost:3001"| STD
    end
```

### Environment Variables

| Variable | Purpose | Default |
|:---|:---|:---|
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO backend URL for the frontend | `window.location.origin` |
| `PORT` | Server listen port | `3000` (unified) / `3001` (standalone) |
| `HOST` | Bind address | `0.0.0.0` |
| `CORS_ORIGIN` | Allowed origins for Socket.IO | `*` |
| `STANDALONE` | Enable standalone mode | `false` |

---

## 11. Testing Strategy

Tests use Node.js built-in test runner (`node --test`):

| Test File | Coverage |
|:---|:---|
| `test/room-manager.test.js` | Unit tests for `RoomManager` — join, leave, destroy, validation |
| `test/realtime-integration.test.js` | Full E2E tests with real Socket.IO connections — bidirectional messaging, 200+ message conversations, concurrent load, cross-room isolation, reconnection, memory purge, room code reuse |

---

## 12. Security Model

| Layer | Mechanism |
|:---|:---|
| **Transport** | WebSocket over TLS (in production) |
| **Input Validation** | Server-side regex, length bounds, type checks |
| **Rate Limiting** | 10 msgs/sec per participant (sliding window) |
| **No Persistence** | Messages never touch disk or database |
| **Room Isolation** | Each room is a separate Map; no cross-room data leaks |
| **Instance UUIDs** | `crypto.randomUUID()` prevents room code reuse collisions |

> **IMPORTANT:** ChitChat guarantees **application-level deletion** only. Transport-layer buffers, ISP logs, browser caches, and OS memory snapshots are outside application control.

---

## 13. NPM Scripts Reference

| Script | Command | Purpose |
|:---|:---|:---|
| `npm start` | `node server.js` | Production unified server |
| `npm run dev` | `next dev --turbo` | Frontend dev with Turbopack |
| `npm run server` | `node server.js` | Alias for unified server |
| `npm run server:standalone` | `node server.js --standalone` | Backend only (port 3001) |
| `npm run build` | `next build` | Production build |
| `npm test` | `node --test test/**/*.test.js` | Run test suite |
| `npm run lint` | `next lint` | ESLint |
