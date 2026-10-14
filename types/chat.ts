export type MessageType = "chat" | "system";

export interface ChatMessage {
  id: string;
  sender: string;
  senderId?: string;
  text: string;
  timestamp: number;
  type: MessageType;
  room?: string;
}

export interface RoomParticipant {
  id: string;
  name: string;
  joinedAt?: number;
  isOnline?: boolean;
}

export interface JoinRoomPayload {
  room: string;
  name: string;
  participantId?: string;
}

export interface SendMessagePayload {
  room: string;
  text: string;
  clientMessageId?: string;
}

export interface LeaveRoomPayload {
  room: string;
  participantId?: string;
}

export interface RoomJoinedResponse {
  success: boolean;
  room: string;
  instanceId: string;
  participantId: string;
  name: string;
  participants: (RoomParticipant | string)[];
  messages: ChatMessage[];
  error?: string;
}

export interface MessageAckResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export type SocketEvent =
  | { type: "JOIN"; room: string; user: string; participant?: RoomParticipant }
  | { type: "LEAVE"; room: string; user: string; participantId?: string }
  | { type: "MESSAGE"; room: string; message: ChatMessage }
  | { type: "PRESENCE"; room: string; user: string; participant?: RoomParticipant }
  | { type: "ROSTER"; room: string; users: (RoomParticipant | string)[] }
  | { type: "ROOM_CLOSED"; room: string; reason: string }
  | { type: "ERROR"; room?: string; error: string };
