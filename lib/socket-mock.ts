"use client";

type MessageType = "chat" | "system";

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  type: MessageType;
}

export type SocketEvent = 
  | { type: "JOIN"; room: string; user: string }
  | { type: "LEAVE"; room: string; user: string }
  | { type: "MESSAGE"; room: string; message: ChatMessage }
  | { type: "PRESENCE"; room: string; user: string };

class SocketMock {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(event: SocketEvent) => void> = new Set();
  private room: string | null = null;
  private user: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.channel = new BroadcastChannel("chitchat_rooms");
      this.channel.onmessage = (event) => {
        const data = event.data as SocketEvent;
        // Only trigger listeners if the event is for the current room
        if (data.room === this.room) {
          this.listeners.forEach(listener => listener(data));
        }
      };
    }
  }

  // Join a room - only broadcasts to OTHER tabs via BroadcastChannel.
  // The local tab handles its own join system message separately.
  join(room: string, user: string) {
    this.room = room;
    this.user = user;
    // Only broadcast to other tabs — local tab handles join via joinRoom()
    this.emit({ type: "JOIN", room, user });
  }

  leave() {
    if (this.room && this.user) {
      const event: SocketEvent = { type: "LEAVE", room: this.room, user: this.user };
      // Broadcast to other tabs
      this.emit(event);
      // Also trigger locally so local user sees their own leave
      this.listeners.forEach(listener => listener(event));
    }
    this.room = null;
    this.user = null;
  }

  // Broadcast presence to OTHER tabs only (via BroadcastChannel)
  broadcastPresence() {
    if (!this.room || !this.user) return;
    this.emit({ type: "PRESENCE", room: this.room, user: this.user });
  }

  sendMessage(text: string) {
    if (!this.room || !this.user) return;
    
    const message: ChatMessage = {
      id: Math.random().toString(36).substring(2, 11),
      sender: this.user,
      text,
      timestamp: Date.now(),
      type: "chat"
    };

    // Broadcast to other tabs
    this.emit({ type: "MESSAGE", room: this.room, message });
    
    // Also trigger for local listener (BroadcastChannel doesn't send to self)
    this.listeners.forEach(listener => listener({ type: "MESSAGE", room: this.room!, message }));
  };

  on(listener: (event: SocketEvent) => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  getUser() {
    return this.user;
  }

  getRoom() {
    return this.room;
  }

  private emit(event: SocketEvent) {
    if (this.channel) {
      this.channel.postMessage(event);
    }
  }
}

// Singleton instance
export const socket = typeof window !== "undefined" ? new SocketMock() : null;
