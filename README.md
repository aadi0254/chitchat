# ChitChat | Private Real-Time Ephemeral Messenger

A sleek, dark-themed, real-time private chat application built with Next.js 14, Tailwind CSS, Lucide React, Node.js, and Socket.IO.

## Key Features & Architecture

- **Real-Time Cross-Device Communication**: Powered by Node.js and Socket.IO with WebSocket and long-polling fallback, enabling seamless chat across different computers, mobile devices, and browsers.
- **Strict Ephemeral Room Lifecycle**: Conversations and participant memberships exist exclusively in-memory while the room is active. No permanent database, disk storage, or browser message history.
- **Complete In-Memory Purge on Room Departure**: When the last participant departs (or upon explicit room closure), room messages, participant rosters, and metadata are immediately destroyed and unreferenced.
- **Reconnection Grace Period**: If a participant experiences a temporary network interruption, a 15-second grace period allows reconnection without destroying the active conversation.
- **Room Code Instance Isolation**: Reusing a 6-digit alphanumeric code generates a completely fresh, isolated room instance with empty message storage, ensuring old conversations can never bleed into new sessions.
- **Unbounded Conversation Length**: No arbitrary message-count cutoff. Chat rooms support 100, 200, 1,000+ continuous messages with optimized frame-safe rendering, cached date formatting, and collision-free identifiers.
- **Server-Authoritative Validation**: Real-time server enforces room code format (`^[A-Z0-9]{6}$`), display name bounds (max 30 characters), message limits (max 1,000 characters), and per-participant rate limits.

---

## Getting Started

### 1. Installation

```bash
npm install
```

### 2. Running Locally

#### Unified Server (Recommended: Serves Next.js + Socket.IO on Port 3000)
```bash
npm start
# or: node server.js
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Development Mode (Turbopack + Standalone Backend)
You can run Next.js dev server alongside the standalone backend:
```bash
# Terminal 1: Backend Server (Port 3001)
npm run server:standalone

# Terminal 2: Next.js Frontend (Port 3000)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001 npm run dev
```

---

## Configuration & Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Port for the HTTP / Socket.IO server | `3000` (unified) or `3001` (standalone) |
| `HOSTNAME` | Host address to bind the server | `0.0.0.0` |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO backend URL for the frontend | Current window origin (`window.location.origin`) |
| `CORS_ORIGIN` | Permitted origin(s) for Socket.IO connections | `*` (or specified URL in production) |
| `STANDALONE` | Set to `"true"` to run standalone Socket.IO server | `false` |

---

## Automated Testing & Verification

Run the comprehensive unit and integration test suite:

```bash
npm test
```

The test suite validates:
1. Bidirectional message exchange between multiple participants.
2. Cross-device and independent client communication.
3. Long continuous conversations beyond 200 and 1,000 messages.
4. Concurrent message dispatching under load.
5. Strict cross-room message isolation.
6. Rejection of invalid and oversized payloads.
7. Disconnection presence updates and reconnection within grace period.
8. Complete room memory destruction and purge upon last participant departure.
9. Room code reuse producing fresh, empty instances.
10. Delayed disconnect safety against race conditions.

---

## Diagnostic Endpoints

- **Health Check**: `GET /health` — Returns server uptime and memory statistics.
- **Room Inspection (Ephemeral Verification)**: `GET /api/rooms/:code` — Returns existence, active participant count, and message count without ever logging or exposing message contents.

---

## Data Privacy & Infrastructure Retention Notice

ChitChat guarantees complete application-level deletion: room messages, participant records, and metadata are cleared from memory when a room closes. However, transport-layer network buffers, ISP/hosting provider proxy logs, browser cache artifacts, and client OS memory snapshots remain outside application-level control.
