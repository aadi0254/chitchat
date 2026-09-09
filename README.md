# ChitChat | Private Real-time Messenger

A sleek, dark-themed, real-time private chat application built with Next.js, Tailwind CSS, and Lucide React.

## Features

- **Room-Based Access**: Create a private room with a random 6-digit alphanumeric code.
- **Real-time Messaging**: Simulated WebSockets using `BroadcastChannel` API (messages sync across tabs instantly).
- **Session Persistence**: Refreshing the page keeps you in the room (via `Session Storage`).
- **Responsive UI**: Fully optimized for mobile and desktop with a premium glassmorphic design.
- **Presence Tracking**: See who else is currently online in the room.
- **Copy to Clipboard**: One-click sharing of the room code.

## Getting Started

Since Node.js was not detected in the environment during development, follow these steps locally:

1.  **Clone/Download** this project directory.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
4.  **Open in Browser**: Navigate to `http://localhost:3000`.

## How to Test Real-time
To see the real-time features in action without a production server:
1. Open the app in two different tabs or windows in your browser.
2. Create or join the **same room code** in both tabs.
3. Send a message in one tab—it will appear instantly in the other!

## Technologies
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Real-time**: BroadcastChannel API (Mock WebSocket)
- **Language**: TypeScript
