// @ts-check
const crypto = require("crypto");

/**
 * @typedef {import("./room-manager").RoomManager} RoomManager
 * @typedef {import("socket.io").Server} SocketIOServer
 * @typedef {import("socket.io").Socket} Socket
 * @typedef {import("../types/chat").ChatMessage} ChatMessage
 */

/**
 * Register Socket.IO handlers
 * @param {SocketIOServer} io
 * @param {RoomManager} roomManager
 */
function registerSocketHandlers(io, roomManager) {
  io.on("connection", (socket) => {
    // Handle Join Room
    socket.on("join_room", (payload, callback) => {
      try {
        if (!payload || typeof payload !== "object") {
          throw new Error("Invalid join payload");
        }

        const { room: roomCode, name, participantId } = payload;
        const { room, participant, isReconnect } = roomManager.joinRoom(
          roomCode,
          name,
          socket.id,
          participantId
        );

        // Join Socket.IO room channel
        socket.join(room.code);

        const activeParticipants = Array.from(room.participants.values())
          .filter(p => p.isOnline)
          .map(p => p.name);

        const response = {
          success: true,
          room: room.code,
          instanceId: room.instanceId,
          participantId: participant.id,
          name: participant.name,
          participants: activeParticipants,
          messages: room.messages
        };

        if (typeof callback === "function") {
          callback(response);
        }
        socket.emit("room_joined", response);

        // Notify other participants in the room
        if (!isReconnect) {
          /** @type {ChatMessage} */
          const sysMsg = {
            id: crypto.randomUUID(),
            sender: "System",
            text: `${participant.name} joined the chat`,
            timestamp: Date.now(),
            type: "system",
            room: room.code
          };
          room.messages.push(sysMsg);

          socket.to(room.code).emit("user_joined", {
            user: participant.name,
            participants: activeParticipants
          });
          io.to(room.code).emit("message", sysMsg);
        } else {
          // Reconnect announcement to peers
          socket.to(room.code).emit("presence_update", {
            user: participant.name,
            participants: activeParticipants
          });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to join room";
        if (typeof callback === "function") {
          callback({ success: false, error: errorMsg });
        }
        socket.emit("error_event", { error: errorMsg });
      }
    });

    // Handle Send Message
    socket.on("send_message", (payload, callback) => {
      try {
        if (!payload || typeof payload !== "object") {
          throw new Error("Invalid message payload");
        }

        const { text, clientMessageId } = payload;
        const message = roomManager.sendMessage(socket.id, text, clientMessageId);

        // Broadcast to all participants in this room (including sender)
        if (message.room) {
          io.to(message.room).emit("message", message);
        }

        if (typeof callback === "function") {
          callback({ success: true, messageId: message.id });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to send message";
        if (typeof callback === "function") {
          callback({ success: false, error: errorMsg });
        }
        socket.emit("error_event", { error: errorMsg });
      }
    });

    // Handle Explicit Leave Room
    socket.on("leave_room", (payload, callback) => {
      try {
        const leaveResult = roomManager.leaveRoom(socket.id);
        if (leaveResult) {
          const { room, participant, remainingCount } = leaveResult;
          socket.leave(room.code);

          if (remainingCount > 0) {
            const activeParticipants = Array.from(room.participants.values())
              .filter(p => p.isOnline)
              .map(p => p.name);

            /** @type {ChatMessage} */
            const sysMsg = {
              id: crypto.randomUUID(),
              sender: "System",
              text: `${participant.name} left the chat`,
              timestamp: Date.now(),
              type: "system",
              room: room.code
            };
            room.messages.push(sysMsg);

            socket.to(room.code).emit("user_left", {
              user: participant.name,
              participants: activeParticipants
            });
            socket.to(room.code).emit("message", sysMsg);
          }
        }

        if (typeof callback === "function") {
          callback({ success: true });
        }
      } catch (err) {
        if (typeof callback === "function") {
          callback({ success: false, error: err instanceof Error ? err.message : "Failed to leave" });
        }
      }
    });

    // Handle Explicit Close Room
    socket.on("close_room", (payload, callback) => {
      try {
        const roomCode = payload?.room || roomManager.socketToRoomCode.get(socket.id);
        if (roomCode) {
          const room = roomManager.getActiveRoom(roomCode);
          if (room) {
            io.to(room.code).emit("room_closed", { reason: "Room closed by host" });
            io.in(room.code).socketsLeave(room.code);
            roomManager.destroyRoom(room.instanceId);
          }
        }
        if (typeof callback === "function") {
          callback({ success: true });
        }
      } catch (err) {
        if (typeof callback === "function") {
          callback({ success: false, error: err instanceof Error ? err.message : "Error closing room" });
        }
      }
    });

    // Handle Transport Disconnect
    socket.on("disconnect", (reason) => {
      roomManager.handleSocketDisconnect(socket.id, (room, participant, remainingCount) => {
        // Callback executed if grace period expired without reconnection
        if (room.status === "active" && remainingCount > 0) {
          const activeParticipants = Array.from(room.participants.values())
            .filter(p => p.isOnline)
            .map(p => p.name);

          /** @type {ChatMessage} */
          const sysMsg = {
            id: crypto.randomUUID(),
            sender: "System",
            text: `${participant.name} left the chat`,
            timestamp: Date.now(),
            type: "system",
            room: room.code
          };
          room.messages.push(sysMsg);

          io.to(room.code).emit("user_left", {
            user: participant.name,
            participants: activeParticipants
          });
          io.to(room.code).emit("message", sysMsg);
        }
      });
    });
  });
}

module.exports = { registerSocketHandlers };
