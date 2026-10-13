# ChitChat | System Architecture & Data Flow

## 1. High-Level System Architecture

ChitChat operates as an entirely client-driven Single Page Application running within the Next.js 14 App Router runtime. Although served from a Next.js web application structure, all communication and state mutations occur exclusively in the browser runtime.

```mermaid
graph TD
    subgraph Browser ["Client Web Browser (Same Origin)"]
        subgraph TabA ["Browser Tab A (Alice)"]
            UI_A["React DOM (page.tsx)"]
            State_A["Local React State<br/>(messages, onlineUsers, view)"]
            Session_A["sessionStorage<br/>('chitchat_auth')"]
            Socket_A["SocketMock Singleton<br/>(lib/socket-mock.ts)"]
            UI_A <--> State_A
            State_A <--> Session_A
            State_A <--> Socket_A
        end

        subgraph TabB ["Browser Tab B (Bob)"]
            UI_B["React DOM (page.tsx)"]
            State_B["Local React State<br/>(messages, onlineUsers, view)"]
            Session_B["sessionStorage<br/>('chitchat_auth')"]
            Socket_B["SocketMock Singleton<br/>(lib/socket-mock.ts)"]
            UI_B <--> State_B
            State_B <--> Session_B
            State_B <--> Socket_B
        end

        BC["Native BroadcastChannel ('chitchat_rooms')"]
        Socket_A <-->|"postMessage / onmessage"| BC
        Socket_B <-->|"postMessage / onmessage"| BC
    end

    subgraph ServerSide ["Next.js Server / Node Runtime"]
        StaticAssets["Static HTML, JS Bundles, CSS"]
    end

    ServerSide -.->|"Initial HTTP Page Load"| Browser
```

---

## 2. Component Hierarchy & State Model

The entire visual application resides in a single component `Home` in `app/page.tsx`. Its internal state machine directs the rendering pipeline:

```mermaid
stateDiagram-v2
    [*] --> CheckSession: Mount (useEffect)
    CheckSession --> LandingView: No sessionStorage
    CheckSession --> LoadingState: sessionStorage exists ("chitchat_auth")
    
    state LandingView {
        [*] --> SelectAction
        SelectAction --> GenerateCode: Click "Create a Room"
        SelectAction --> JoinView: Click "Join a Room"
    }

    GenerateCode --> JoinView: Prefills 6-digit room code
    
    state JoinView {
        [*] --> FormInput: Enter Display Name & Room Code
        FormInput --> ValidateInput: Click "Enter Chat Room"
        ValidateInput --> FormInput: Validation Error (empty / <6 chars)
        ValidateInput --> LoadingState: Valid Input
    }

    state LoadingState {
        [*] --> TimerWait: 800ms simulated connection delay
        TimerWait --> ChatView: Set view = "chat"
    }

    state ChatView {
        [*] --> ConnectSocket: socket.join(room, name)
        ConnectSocket --> ActiveChat: Listen for events & render UI
        ActiveChat --> LandingView: Click "Leave Room" (socket.leave())
    }
```

---

## 3. Real-Time Communication Engine (`SocketMock`)

### The `BroadcastChannel` Mechanism
1. **Scope & Origin**:
   - `BroadcastChannel` allows communication between different browsing contexts (tabs, windows, iframes, workers) sharing the **exact same origin** (`protocol + hostname + port`).
   - Cross-browser (e.g., Chrome to Firefox) or cross-device (e.g., PC to mobile) communication is impossible without a centralized network server.
2. **Channel Singleton**:
   - The constructor of `SocketMock` opens a channel named `"chitchat_rooms"`:
     ```ts
     this.channel = new BroadcastChannel("chitchat_rooms");
     ```
   - All rooms share this single channel. Room multiplexing is achieved via an envelope property (`data.room`).
3. **Loopback Behavior**:
   - The W3C specification dictates that `BroadcastChannel.postMessage()` sends events to **all other** listening contexts, but **does not dispatch to the sender**.
   - Because of this, `sendMessage` explicitly calls local listeners:
     ```ts
     this.emit({ type: "MESSAGE", room: this.room, message });
     this.listeners.forEach(listener => listener({ type: "MESSAGE", room: this.room!, message }));
     ```
   - For `JOIN`, the local tab intentionally does not trigger its own listener, instead generating its own local system message in `app/page.tsx:120`.

---

## 4. Sequence & Event Flow

### Room Joining & Presence Handshake Sequence

When a user in Tab B joins a room already occupied by a user in Tab A:

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Tab A (Alice in Room "XYZ123")
    participant BC as BroadcastChannel ("chitchat_rooms")
    actor Bob as Tab B (Bob entering "XYZ123")

    Bob->>Bob: Submit Form (Name: "Bob", Room: "XYZ123")
    Bob->>Bob: Show Spinner (800ms simulated connection delay)
    Bob->>Bob: Write sessionStorage("chitchat_auth", {name, room})
    Bob->>Bob: Switch view to "chat" (setOnlineUsers(["Bob"]))
    Bob->>BC: emit JOIN { room: "XYZ123", user: "Bob" }
    Bob->>Bob: Add local system message: "Bob joined the chat"

    BC->>Alice: onmessage JOIN { room: "XYZ123", user: "Bob" }
    Alice->>Alice: Check data.room === "XYZ123" (Match)
    Alice->>Alice: Update onlineUsers: Add "Bob"
    Alice->>Alice: Add system message: "Bob joined the chat"
    Alice->>BC: emit PRESENCE { room: "XYZ123", user: "Alice" }

    BC->>Bob: onmessage PRESENCE { room: "XYZ123", user: "Alice" }
    Bob->>Bob: Check data.room === "XYZ123" (Match)
    Bob->>Bob: Update onlineUsers: Add "Alice"
    Note over Alice,Bob: Both tabs now show ["Alice", "Bob"] online!
```

---

### Message Dispatch Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Tab A (Alice)
    participant BC as BroadcastChannel ("chitchat_rooms")
    actor Bob as Tab B (Bob)

    Alice->>Alice: Types "Hello Bob!" and submits form
    Alice->>Alice: socket.sendMessage("Hello Bob!")
    Alice->>Alice: Generate msg = { id, sender: "Alice", text: "Hello Bob!", timestamp, type: "chat" }
    
    par Broadcast to Other Tabs
        Alice->>BC: postMessage MESSAGE { room: "XYZ123", message: msg }
        BC->>Bob: onmessage MESSAGE { room: "XYZ123", message: msg }
        Bob->>Bob: Check room match: setMessages(prev => [...prev, msg])
        Bob->>Bob: DOM auto-scroll to bottom
    and Dispatch to Local Tab
        Alice->>Alice: Local listeners.forEach(listener(msg))
        Alice->>Alice: setMessages(prev => [...prev, msg])
        Alice->>Alice: DOM auto-scroll to bottom
    end
```

---

## 5. Architectural Tradeoffs & Verified Limitations

| Architectural Decision | Chosen Implementation | Tradeoff / Consequence | Code Evidence |
| :--- | :--- | :--- | :--- |
| **Real-time Engine** | Native `BroadcastChannel` | Zero backend setup required, but strictly limited to same-browser, same-origin tabs. Cannot support mobile/desktop interop. | `lib/socket-mock.ts:27` |
| **Data Persistence** | None (in-memory arrays) | Messages are lost upon page reload or tab closure. New joiners cannot see message history. | `app/page.tsx:30` |
| **Session Tracking** | Browser `sessionStorage` | Preserves name & room across refresh, but clears when closing tab. Refresh causes complete message history loss. | `app/page.tsx:42, 109` |
| **Presence Teardown** | Manual button click only | Closing a tab directly fails to emit `LEAVE`. Ghost users remain permanently in other tabs' rosters. | `app/page.tsx:170`, `lib/socket-mock.ts:47` |
| **Component Structure** | Monolithic `page.tsx` | All 3 screens and sidebar reside in one file. Hinders component reusability and isolated unit testing. | `app/page.tsx` (449 lines) |
| **Theme System** | HSL CSS variables | Intended for dynamic theme toggling, but missing `hsl()` wrapper in `tailwind.config.ts`, breaking classes. | `tailwind.config.ts:12-33`, `app/globals.css:5-26` |
