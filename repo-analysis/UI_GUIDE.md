# ChitChat | UI & Design System Guide

## 1. Screen & View Inventory

The application has a single route (`/`) rendered by `app/page.tsx` that dynamically swaps views based on the `view` state string and `loading` boolean.

```
┌─────────────────────────────────────────────────────────────┐
│                      app/layout.tsx                         │
│                    (<html class="dark">)                    │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    app/page.tsx                       │  │
│  │                                                       │  │
│  │  [if loading]                                         │  │
│  │  └── Fullscreen Spinner ("Entering Secure Room...")   │  │
│  │                                                       │  │
│  │  [if view === "landing"]                              │  │
│  │  └── Landing Hero + 2 Action Cards                    │  │
│  │      ├── "Create a Room"                              │  │
│  │      └── "Join a Room"                                │  │
│  │                                                       │  │
│  │  [if view === "join"]                                 │  │
│  │  └── Glassmorphic Access Modal                        │  │
│  │      ├── Back button                                  │  │
│  │      ├── Display Name input                           │  │
│  │      ├── 6-digit uppercase Room Code input            │  │
│  │      └── Submit button                                │  │
│  │                                                       │  │
│  │  [if view === "chat"]                                 │  │
│  │  └── Full-viewport Chat Dashboard                     │  │
│  │      ├── Sidebar (md:w-80)                            │  │
│  │      │   ├── Header (Logo + Leave button)             │  │
│  │      │   ├── Room Code box + Copy button              │  │
│  │      │   └── Online Users roster + presence count     │  │
│  │      └── Main Area (flex-1)                           │  │
│  │          ├── Room Header (Mobile code / Desktop title)│  │
│  │          ├── Message Scroll Feed (User & System msgs) │  │
│  │          └── Bottom Message Input Bar + Send button   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Design System Tokens & Styling Conventions

### Color Palette (HSL System)
The theme uses CSS variables declared in [`app/globals.css:5-26`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/app/globals.css#L5-L26) under `:root`.

| Token Name | Raw HSL Values | Intended Visual Role | Hex Approx |
| :--- | :--- | :--- | :--- |
| `--background` | `224 71% 4%` | Deep obsidian dark background | `#030712` |
| `--foreground` | `213 31% 91%` | Bright off-white body text | `#E2E8F0` |
| `--primary` | `263.4 70% 50.4%` | Electric violet / purple accent | `#7C3AED` |
| `--primary-foreground` | `210 40% 98%` | White text on primary buttons | `#F8FAFC` |
| `--secondary` | `222.2 47.4% 11.2%`| Slate-tinted card surface | `#0F172A` |
| `--secondary-foreground`| `210 40% 98%` | Subtle contrast text | `#F8FAFC` |
| `--accent` | `217.2 32.6% 17.5%`| Muted border / input fill | `#1E293B` |
| `--card` | `224 71% 4%` | Card backgrounds | `#030712` |
| `--border` | `217.2 32.6% 17.5%`| Dividers and input borders | `#1E293B` |
| `--radius` | `0.75rem` (`12px`) | Rounded corner standard | `12px` |

---

### CRITICAL BUG: Tailwind Variable Declaration Mismatch
In [`tailwind.config.ts:11-33`](file:///c:/Users/karsh/Desktop/websites-source-codes/chit-chat/chitchat/tailwind.config.ts#L11-L33), colors are defined as:
```typescript
colors: {
  background: "var(--background)",
  foreground: "var(--foreground)",
  primary: {
    DEFAULT: "var(--primary)",
    foreground: "var(--primary-foreground)",
  },
  // ...
}
```
Because `globals.css` declares `--background: 224 71% 4%;` (raw space-separated numbers without the `hsl(...)` wrapper), Tailwind generates:
```css
.bg-background { background-color: var(--background); } /* background-color: 224 71% 4%; -> INVALID CSS! */
.text-primary  { color: var(--primary); }               /* color: 263.4 70% 50.4%; -> INVALID CSS! */
```
**Consequence**: The browser ignores these CSS declarations because they are syntactically invalid!

**Required Fix**:
In `tailwind.config.ts`, wrap each variable in `hsl(...)`:
```typescript
colors: {
  background: "hsl(var(--background) / <alpha-value>)",
  foreground: "hsl(var(--foreground) / <alpha-value>)",
  primary: {
    DEFAULT: "hsl(var(--primary) / <alpha-value>)",
    foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
  },
  secondary: {
    DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
    foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
  },
  accent: {
    DEFAULT: "hsl(var(--accent) / <alpha-value>)",
    foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
  },
  // ...
}
```

---

### Glassmorphism Styles (`app/globals.css`)
- `.glass`:
  ```css
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  ```
- `.glass-card`:
  ```css
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  ```

---

### Typography & Fonts
- Primary Font: **Inter** from `next/font/google`.
- Imported in `app/layout.tsx:2-5` and applied to `<body>` via `${inter.className}`.
- Fallback font in `globals.css:31`: `font-family: 'Inter', sans-serif;`.

---

### Animation Tokens
- `animate-fade-in`: 0.5s ease-out opacity transition.
- `animate-slide-up`: 0.3s ease-out `translateY(10px) -> translateY(0)`.
- `animate-slide-down`: 0.3s ease-out `translateY(-10px) -> translateY(0)`.
- `animate-spin`: Native Tailwind 360-degree continuous rotation.
- `animate-pulse`: Native Tailwind gentle opacity pulsing.
- **Defect**: `animate-shake` is referenced in `app/page.tsx:290` (`<p className="... animate-shake">{error}</p>`), but is **not defined** in either `tailwind.config.ts` or `globals.css`.

---

## 3. Responsive Breakpoints & Mobile Behavior

- **Mobile Viewports (`< 768px`)**:
  - Main layout stacks vertically: `flex flex-col md:flex-row`.
  - In Chat view, the sidebar collapses into a top compact panel (`h-auto md:h-full`), showing room code and online user pill.
  - The chat area takes the remainder of the vertical viewport.
  - Mobile header displays a compact hash icon and room code (`md:hidden`).
- **Desktop Viewports (`>= 768px`)**:
  - The sidebar expands into a fixed 320px column (`md:w-80`).
  - Full desktop header appears ("General Room Chat" with subtitle).
  - Landing cards arrange in a 2-column grid (`md:grid-cols-2`).

---

## 4. Component Refactoring Blueprint

To eliminate the monolithic 449-line structure in `app/page.tsx`, future changes should extract components into a new `components/` directory:

```
components/
├── landing/
│   └── landing-view.tsx       # Hero, "Create a Room", "Join a Room"
├── room/
│   ├── join-modal.tsx         # Display Name & Room Code form
│   └── loading-screen.tsx     # Fullscreen connection spinner
└── chat/
    ├── chat-sidebar.tsx       # Logo, Leave button, Copy Code, Online Users
    ├── chat-header.tsx        # Mobile/Desktop top navigation
    ├── message-list.tsx       # Scrollable container & auto-scroll hook
    ├── message-bubble.tsx     # Individual chat/system message pill
    └── chat-input.tsx         # Message textfield and submit button
```
