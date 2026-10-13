"use client";

import { io, Socket } from "socket.io-client";
import { ChatMessage, SocketEvent, RoomJoinedResponse } from "@/types/chat";

class RealSocketClient {
  private socket: Socket | null = null;
  private listeners: Set<(event: SocketEvent) => void> = new Set();
  private room: string | null = null;
  private user: string | null = null;
  private participantId: string | null = null;
  private serverUrl: string = "";

  constructor() {
    if (typeof window !== "undefined") {
      this.initConnection();
    }
  }

  private initConnection() {
    // Determine backend URL:
    // 1. Explicit env var
    // 2. Window location origin (if backend is on same port)
    // 3. Fallback to port 3001 in dev
    let targetUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "";
    if (!targetUrl && typeof window !== "undefined") {
      targetUrl = window.location.origin;
    }
    this.serverUrl = targetUrl;

    // Load persisted participant identity if available
    try {
      this.participantId = sessionStorage.getItem("chitchat_pid");
    } catch {
      // Ignore sessionStorage errors
    }

    this.socket = io(this.serverUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ["websocket", "polling"],
      timeout: 10000
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      // If we already had an active room, attempt seamless rejoin on reconnect
      if (this.room && this.user) {
        this.socket?.emit("join_room", {
          room: this.room,
          name: this.user,
          participantId: this.participantId || undefined
        });
      }
    });

    this.socket.on("message", (message: ChatMessage) => {
      this.notifyListeners({
        type: "MESSAGE",
        room: message.room || this.room || "",
        message
      });
    });

    this.socket.on("user_joined", (data: { user: string; participants: string[] }) => {
      this.notifyListeners({
        type: "JOIN",
        room: this.room || "",
        user: data.user
      });
      this.notifyListeners({
        type: "ROSTER",
        room: this.room || "",
        users: data.participants
      });
    });

    this.socket.on("user_left", (data: { user: string; participants: string[] }) => {
      this.notifyListeners({
        type: "LEAVE",
        room: this.room || "",
        user: data.user
      });
      this.notifyListeners({
        type: "ROSTER",
        room: this.room || "",
        users: data.participants
      });
    });

    this.socket.on("presence_update", (data: { user: string; participants: string[] }) => {
      this.notifyListeners({
        type: "PRESENCE",
        room: this.room || "",
        user: data.user
      });
      this.notifyListeners({
        type: "ROSTER",
        room: this.room || "",
        users: data.participants
      });
    });

    this.socket.on("room_closed", (data: { reason: string }) => {
      this.notifyListeners({
        type: "ROOM_CLOSED",
        room: this.room || "",
        reason: data.reason
      });
      this.room = null;
    });

    this.socket.on("error_event", (data: { error: string }) => {
      this.notifyListeners({
        type: "ERROR",
        room: this.room || "",
        error: data.error
      });
    });
  }

  private notifyListeners(event: SocketEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error("Error in socket event listener:", err);
      }
    });
  }

  /**
   * Connect to backend and join room
   */
  join(room: string, user: string): Promise<RoomJoinedResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        this.initConnection();
      }

      if (!this.socket) {
        reject(new Error("Socket connection unavailable"));
        return;
      }

      this.room = room.trim().toUpperCase();
      this.user = user.trim();

      if (!this.socket.connected) {
        this.socket.connect();
      }

      const timeout = setTimeout(() => {
        reject(new Error("Connection timed out while joining room. Please check your network."));
      }, 8000);

      this.socket.emit(
        "join_room",
        {
          room: this.room,
          name: this.user,
          participantId: this.participantId || undefined
        },
        (response: RoomJoinedResponse) => {
          clearTimeout(timeout);
          if (response && response.success) {
            this.participantId = response.participantId;
            try {
              sessionStorage.setItem("chitchat_pid", response.participantId);
            } catch {
              // Ignore
            }
            // Emit ROSTER so UI immediately has accurate active list
            if (response.participants) {
              this.notifyListeners({
                type: "ROSTER",
                room: this.room!,
                users: response.participants
              });
            }
            resolve(response);
          } else {
            reject(new Error(response?.error || "Failed to join room"));
          }
        }
      );
    });
  }

  /**
   * Explicitly leave the active room
   */
  leave(): Promise<void> {
    return new Promise((resolve) => {
      if (this.socket && this.socket.connected && this.room) {
        this.socket.emit("leave_room", { room: this.room }, () => {
          resolve();
        });
      } else {
        resolve();
      }

      this.room = null;
      this.user = null;
      try {
        sessionStorage.removeItem("chitchat_pid");
      } catch {
        // Ignore
      }
    });
  }

  /**
   * Send a chat message with acknowledgment
   */
  sendMessage(text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        resolve({ success: false, error: "Not connected to server" });
        return;
      }

      if (!this.room || !this.user) {
        resolve({ success: false, error: "Not in an active chat room" });
        return;
      }

      const trimmed = text.trim();
      if (!trimmed) {
        resolve({ success: false, error: "Message cannot be empty" });
        return;
      }

      const timeout = setTimeout(() => {
        resolve({ success: false, error: "Message delivery timed out" });
      }, 5000);

      this.socket.emit(
        "send_message",
        {
          room: this.room,
          text: trimmed
        },
        (res: { success: boolean; messageId?: string; error?: string }) => {
          clearTimeout(timeout);
          if (res && res.success) {
            resolve({ success: true, messageId: res.messageId });
          } else {
            resolve({ success: false, error: res?.error || "Failed to deliver message" });
          }
        }
      );
    });
  }

  /**
   * Explicitly close room (if host)
   */
  closeRoom(): Promise<void> {
    return new Promise((resolve) => {
      if (this.socket && this.socket.connected && this.room) {
        this.socket.emit("close_room", { room: this.room }, () => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Register event listener
   */
  on(listener: (event: SocketEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getUser(): string | null {
    return this.user;
  }

  getRoom(): string | null {
    return this.room;
  }

  getParticipantId(): string | null {
    return this.participantId;
  }

  isConnected(): boolean {
    return !!(this.socket && this.socket.connected);
  }
}

// Singleton client instance
export const socket = typeof window !== "undefined" ? new RealSocketClient() : null;
export type { ChatMessage, SocketEvent };
