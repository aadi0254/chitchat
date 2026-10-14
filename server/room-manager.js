// @ts-check
const crypto = require("crypto");

/**
 * @typedef {import("../types/chat").ChatMessage} ChatMessage
 * 
 * @typedef {Object} Participant
 * @property {string} id - Unique UUID
 * @property {string} name - Display name
 * @property {string} socketId - Active socket connection ID
 * @property {number} joinedAt - Epoch timestamp
 * @property {boolean} isOnline - Online state
 */

/**
 * @typedef {Object} RoomInstance
 * @property {string} code - 6-character room code (e.g. ABC123)
 * @property {string} instanceId - Unique UUID for this room lifecycle
 * @property {number} createdAt - Epoch timestamp
 * @property {"active" | "closing" | "closed"} status
 * @property {Map<string, Participant>} participants - participantId -> Participant
 * @property {Map<string, string>} socketToParticipant - socketId -> participantId
 * @property {ChatMessage[]} messages - Ephemeral messages in memory
 * @property {Map<string, NodeJS.Timeout>} disconnectTimers - participantId -> Timer
 * @property {Map<string, { count: number, resetAt: number }>} rateLimits - participantId -> RateLimit
 */

class RoomManager {
  /**
   * @param {Object} [options]
   * @param {number} [options.disconnectGracePeriodMs=15000] - Grace period before disconnecting participant
   * @param {number} [options.maxMessageLength=1000]
   * @param {number} [options.maxNameLength=30]
   * @param {number} [options.rateLimitWindowMs=1000]
   * @param {number} [options.rateLimitMaxPerWindow=10]
   */
  constructor(options = {}) {
    this.disconnectGracePeriodMs = options.disconnectGracePeriodMs ?? 15000;
    this.maxMessageLength = options.maxMessageLength ?? 1000;
    this.maxNameLength = options.maxNameLength ?? 30;
    this.rateLimitWindowMs = options.rateLimitWindowMs ?? 1000;
    this.rateLimitMaxPerWindow = options.rateLimitMaxPerWindow ?? 10;

    /** @type {Map<string, RoomInstance>} */
    this.roomsByCode = new Map();

    /** @type {Map<string, RoomInstance>} */
    this.roomsByInstanceId = new Map();

    /** @type {Map<string, string>} socketId -> roomCode */
    this.socketToRoomCode = new Map();
  }

  /**
   * Normalize and validate room code
   * @param {string} code
   * @returns {string}
   */
  normalizeRoomCode(code) {
    if (!code || typeof code !== "string") {
      throw new Error("Invalid room code: Code must be a non-empty string");
    }
    const normalized = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(normalized)) {
      throw new Error("Invalid room code: Must be exactly 6 alphanumeric characters (A-Z, 0-9)");
    }
    return normalized;
  }

  /**
   * Normalize and validate display name
   * @param {string} name
   * @returns {string}
   */
  normalizeDisplayName(name) {
    if (!name || typeof name !== "string") {
      throw new Error("Invalid display name: Name cannot be empty");
    }
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      throw new Error("Invalid display name: Name cannot be empty");
    }
    if (trimmed.length > this.maxNameLength) {
      throw new Error(`Invalid display name: Exceeds maximum length of ${this.maxNameLength} characters`);
    }
    return trimmed;
  }

  /**
   * Get active room instance or create a fresh instance if none exists
   * @param {string} rawCode
   * @returns {RoomInstance}
   */
  getOrCreateRoom(rawCode) {
    const code = this.normalizeRoomCode(rawCode);
    const existing = this.roomsByCode.get(code);

    if (existing && existing.status === "active") {
      return existing;
    }

    // Create fresh instance
    const instanceId = crypto.randomUUID();
    /** @type {RoomInstance} */
    const newInstance = {
      code,
      instanceId,
      createdAt: Date.now(),
      status: "active",
      participants: new Map(),
      socketToParticipant: new Map(),
      messages: [],
      disconnectTimers: new Map(),
      rateLimits: new Map()
    };

    this.roomsByCode.set(code, newInstance);
    this.roomsByInstanceId.set(instanceId, newInstance);
    return newInstance;
  }

  /**
   * Get active room by code
   * @param {string} rawCode
   * @returns {RoomInstance | null}
   */
  getActiveRoom(rawCode) {
    try {
      const code = this.normalizeRoomCode(rawCode);
      const room = this.roomsByCode.get(code);
      return room && room.status === "active" ? room : null;
    } catch {
      return null;
    }
  }

  /**
   * Join or reconnect to a room
   * @param {string} rawCode
   * @param {string} rawName
   * @param {string} socketId
   * @param {string} [participantId]
   * @returns {{ room: RoomInstance, participant: Participant, isReconnect: boolean }}
   */
  joinRoom(rawCode, rawName, socketId, participantId) {
    const code = this.normalizeRoomCode(rawCode);
    const name = this.normalizeDisplayName(rawName);

    const room = this.getOrCreateRoom(code);
    if (room.status !== "active") {
      throw new Error("Room is closed and no longer accepting participants");
    }

    // Clean up any previous room registration for this socketId
    this.socketToRoomCode.set(socketId, code);

    // Check if this socket already has a participant in this room, or if reconnecting with participantId
    const existingSocketPid = room.socketToParticipant.get(socketId);
    const targetPid = participantId || existingSocketPid;

    // Reconnection or socket re-registration check
    if (targetPid && room.participants.has(targetPid)) {
      const participant = /** @type {Participant} */ (room.participants.get(targetPid));

      // Cancel disconnect timer if active
      if (room.disconnectTimers.has(targetPid)) {
        clearTimeout(/** @type {NodeJS.Timeout} */ (room.disconnectTimers.get(targetPid)));
        room.disconnectTimers.delete(targetPid);
      }

      // Remove old socket mapping if different
      if (participant.socketId && participant.socketId !== socketId) {
        room.socketToParticipant.delete(participant.socketId);
        this.socketToRoomCode.delete(participant.socketId);
      }

      participant.socketId = socketId;
      participant.name = name;
      participant.isOnline = true;
      room.socketToParticipant.set(socketId, targetPid);

      return { room, participant, isReconnect: true };
    }

    // Fresh join
    const pId = participantId && /^[0-9a-fA-F-]{36}$/.test(participantId)
      ? participantId
      : crypto.randomUUID();

    /** @type {Participant} */
    const newParticipant = {
      id: pId,
      name,
      socketId,
      joinedAt: Date.now(),
      isOnline: true
    };

    room.participants.set(pId, newParticipant);
    room.socketToParticipant.set(socketId, pId);

    return { room, participant: newParticipant, isReconnect: false };
  }

  /**
   * Send a message to the room
   * @param {string} socketId
   * @param {string} text
   * @param {string} [clientMessageId]
   * @returns {ChatMessage}
   */
  sendMessage(socketId, text, clientMessageId) {
    const roomCode = this.socketToRoomCode.get(socketId);
    if (!roomCode) {
      throw new Error("Unauthorized: Socket is not joined in any room");
    }

    const room = this.roomsByCode.get(roomCode);
    if (!room || room.status !== "active") {
      throw new Error("Room is closed or does not exist");
    }

    const participantId = room.socketToParticipant.get(socketId);
    if (!participantId) {
      throw new Error("Unauthorized: Participant not recognized in this room");
    }

    const participant = room.participants.get(participantId);
    if (!participant) {
      throw new Error("Unauthorized: Participant record not found");
    }

    // Validate text
    if (!text || typeof text !== "string") {
      throw new Error("Message text must be a non-empty string");
    }
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      throw new Error("Message cannot be empty or whitespace only");
    }
    if (trimmed.length > this.maxMessageLength) {
      throw new Error(`Message exceeds maximum length of ${this.maxMessageLength} characters`);
    }

    // Rate limiting
    const now = Date.now();
    let rateInfo = room.rateLimits.get(participantId);
    if (!rateInfo || now > rateInfo.resetAt) {
      rateInfo = { count: 1, resetAt: now + this.rateLimitWindowMs };
      room.rateLimits.set(participantId, rateInfo);
    } else {
      rateInfo.count++;
      if (rateInfo.count > this.rateLimitMaxPerWindow) {
        throw new Error("Rate limit exceeded: Please wait before sending more messages");
      }
    }

    /** @type {ChatMessage} */
    const message = {
      id: clientMessageId && typeof clientMessageId === "string" ? clientMessageId : crypto.randomUUID(),
      sender: participant.name,
      senderId: participant.id,
      text: trimmed,
      timestamp: now,
      type: "chat",
      room: room.code
    };

    room.messages.push(message);
    return message;
  }

  /**
   * Handle unexpected socket disconnection
   * @param {string} socketId
   * @param {(room: RoomInstance, participant: Participant, remainingCount: number) => void} [onGraceExpired]
   * @returns {{ room: RoomInstance, participant: Participant } | null}
   */
  handleSocketDisconnect(socketId, onGraceExpired) {
    const roomCode = this.socketToRoomCode.get(socketId);
    if (!roomCode) return null;

    this.socketToRoomCode.delete(socketId);
    const room = this.roomsByCode.get(roomCode);
    if (!room || room.status === "closed") return null;

    const participantId = room.socketToParticipant.get(socketId);
    if (!participantId) return null;

    room.socketToParticipant.delete(socketId);
    const participant = room.participants.get(participantId);
    if (!participant) return null;

    participant.isOnline = false;

    // Start reconnection grace period timer
    const timer = setTimeout(() => {
      // If grace period expires and participant never reconnected:
      room.disconnectTimers.delete(participantId);
      if (!participant.isOnline) {
        room.participants.delete(participantId);
        room.rateLimits.delete(participantId);

        const remainingOnline = Array.from(room.participants.values()).filter(p => p.isOnline).length;
        if (typeof onGraceExpired === "function") {
          onGraceExpired(room, participant, remainingOnline);
        }

        // Check if room is completely empty
        if (room.participants.size === 0) {
          this.destroyRoom(room.instanceId);
        }
      }
    }, this.disconnectGracePeriodMs);

    room.disconnectTimers.set(participantId, timer);
    return { room, participant };
  }

  /**
   * Explicitly leave room (e.g. user clicks Leave Room)
   * @param {string} socketId
   * @returns {{ room: RoomInstance, participant: Participant, remainingCount: number } | null}
   */
  leaveRoom(socketId) {
    const roomCode = this.socketToRoomCode.get(socketId);
    if (!roomCode) return null;

    this.socketToRoomCode.delete(socketId);
    const room = this.roomsByCode.get(roomCode);
    if (!room || room.status === "closed") return null;

    const participantId = room.socketToParticipant.get(socketId);
    if (!participantId) return null;

    room.socketToParticipant.delete(socketId);

    // Cancel any disconnect timer
    if (room.disconnectTimers.has(participantId)) {
      clearTimeout(/** @type {NodeJS.Timeout} */ (room.disconnectTimers.get(participantId)));
      room.disconnectTimers.delete(participantId);
    }

    const participant = room.participants.get(participantId);
    room.participants.delete(participantId);
    room.rateLimits.delete(participantId);

    if (!participant) return null;

    const remainingCount = room.participants.size;

    // If last participant left, destroy room immediately
    if (remainingCount === 0) {
      this.destroyRoom(room.instanceId);
    }

    return { room, participant, remainingCount };
  }

  /**
   * Explicitly close room
   * @param {string} rawCode
   * @param {string} [reason]
   * @returns {boolean}
   */
  closeRoom(rawCode, reason = "Room closed by host") {
    const room = this.getActiveRoom(rawCode);
    if (!room) return false;
    this.destroyRoom(room.instanceId);
    return true;
  }

  /**
   * Complete, idempotent ephemeral cleanup of a room instance
   * @param {string} instanceId
   * @returns {boolean}
   */
  destroyRoom(instanceId) {
    const room = this.roomsByInstanceId.get(instanceId);
    if (!room) return false;

    // Mark as closed to reject incoming operations immediately
    room.status = "closed";

    // Cancel all pending disconnect timers
    room.disconnectTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    room.disconnectTimers.clear();

    // Remove socket mappings associated with this room
    room.socketToParticipant.forEach((_, sId) => {
      this.socketToRoomCode.delete(sId);
    });

    // Verify code mapping points to this exact instance before deleting
    const currentForCode = this.roomsByCode.get(room.code);
    if (currentForCode && currentForCode.instanceId === instanceId) {
      this.roomsByCode.delete(room.code);
    }

    this.roomsByInstanceId.delete(instanceId);

    // Completely empty ephemeral data structures
    room.messages.length = 0;
    room.participants.clear();
    room.socketToParticipant.clear();
    room.rateLimits.clear();

    return true;
  }

  /**
   * Diagnostic statistics for testing and health monitoring
   */
  getStats() {
    return {
      activeRooms: this.roomsByCode.size,
      totalInstances: this.roomsByInstanceId.size,
      activeSockets: this.socketToRoomCode.size
    };
  }
}

module.exports = { RoomManager };
