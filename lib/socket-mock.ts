"use client";

// Re-export RealSocketClient instance and types for full backward compatibility
export { socket } from "@/lib/socket";
export type { ChatMessage, SocketEvent, RoomParticipant } from "@/types/chat";
