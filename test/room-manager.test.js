// @ts-check
const test = require("node:test");
const assert = require("node:assert/strict");
const { RoomManager } = require("../server/room-manager");

test("RoomManager - Creation and code normalization", () => {
  const rm = new RoomManager();
  const room1 = rm.getOrCreateRoom("abc123");
  assert.equal(room1.code, "ABC123");
  assert.equal(typeof room1.instanceId, "string");
  assert.equal(room1.status, "active");
  assert.equal(room1.messages.length, 0);

  // Invalid codes
  assert.throws(() => rm.getOrCreateRoom("12345"), /Invalid room code/);
  assert.throws(() => rm.getOrCreateRoom("toolongcode"), /Invalid room code/);
  assert.throws(() => rm.getOrCreateRoom("abc!23"), /Invalid room code/);
});

test("RoomManager - Joining and participant tracking", () => {
  const rm = new RoomManager();
  const { room, participant, isReconnect } = rm.joinRoom("TEST01", "Alice", "socket-1");
  assert.equal(isReconnect, false);
  assert.equal(participant.name, "Alice");
  assert.equal(participant.socketId, "socket-1");
  assert.equal(room.participants.size, 1);

  // Second user
  const res2 = rm.joinRoom("TEST01", "Bob", "socket-2");
  assert.equal(res2.isReconnect, false);
  assert.equal(res2.participant.name, "Bob");
  assert.equal(room.participants.size, 2);
});

test("RoomManager - Reconnection within grace period preserves participant", () => {
  const rm = new RoomManager({ disconnectGracePeriodMs: 5000 });
  const { participant } = rm.joinRoom("RECON1", "Charlie", "socket-c1");
  const pId = participant.id;

  // Socket disconnects
  const disconnectRes = rm.handleSocketDisconnect("socket-c1");
  assert.ok(disconnectRes);
  assert.equal(participant.isOnline, false);
  assert.ok(disconnectRes.room.disconnectTimers.has(pId));

  // Reconnect with same participantId
  const reconnectRes = rm.joinRoom("RECON1", "Charlie", "socket-c2", pId);
  assert.equal(reconnectRes.isReconnect, true);
  assert.equal(reconnectRes.participant.isOnline, true);
  assert.equal(reconnectRes.participant.socketId, "socket-c2");
  assert.equal(disconnectRes.room.disconnectTimers.has(pId), false);
});

test("RoomManager - Message sending, validation, and no message count cutoff", () => {
  const rm = new RoomManager({ rateLimitMaxPerWindow: 2000 });
  const { room } = rm.joinRoom("MSGS01", "Dave", "socket-d");

  // Send single message
  const msg1 = rm.sendMessage("socket-d", "Hello World");
  assert.equal(msg1.text, "Hello World");
  assert.equal(msg1.sender, "Dave");
  assert.equal(room.messages.length, 1);

  // Validation: empty text
  assert.throws(() => rm.sendMessage("socket-d", "   "), /cannot be empty/);

  // Validation: oversized text (>1000 chars)
  const hugeText = "A".repeat(1001);
  assert.throws(() => rm.sendMessage("socket-d", hugeText), /exceeds maximum length/);

  // Verify conversation continues beyond 200 and beyond 1,000 messages
  for (let i = 2; i <= 1050; i++) {
    rm.sendMessage("socket-d", `Message #${i}`);
  }
  assert.equal(room.messages.length, 1050);
  assert.equal(room.messages[1049].text, "Message #1050");
});

test("RoomManager - Last participant leaves destroys room completely", () => {
  const rm = new RoomManager();
  const { room } = rm.joinRoom("CLEAN1", "Eve", "socket-e");
  const instanceId = room.instanceId;

  rm.sendMessage("socket-e", "Secret ephemeral message");
  assert.equal(room.messages.length, 1);

  // Leave room
  const leaveRes = rm.leaveRoom("socket-e");
  assert.ok(leaveRes);
  assert.equal(leaveRes.remainingCount, 0);

  // Verify room is removed from active map
  assert.equal(rm.getActiveRoom("CLEAN1"), null);
  assert.equal(rm.roomsByInstanceId.has(instanceId), false);
  assert.equal(room.messages.length, 0);
  assert.equal(room.participants.size, 0);
  assert.equal(room.status, "closed");
});

test("RoomManager - Reusing room code creates fresh instance with zero history", () => {
  const rm = new RoomManager();
  
  // Instance 1
  const { room: room1 } = rm.joinRoom("REUSE1", "Frank", "socket-f1");
  rm.sendMessage("socket-f1", "Old Conversation Message");
  const instance1Id = room1.instanceId;
  rm.leaveRoom("socket-f1"); // Leaves & destroys room1

  assert.equal(rm.getActiveRoom("REUSE1"), null);

  // Instance 2 with same code REUSE1
  const { room: room2 } = rm.joinRoom("REUSE1", "Grace", "socket-g");
  assert.notEqual(room2.instanceId, instance1Id);
  assert.equal(room2.messages.length, 0);
  assert.equal(room2.participants.size, 1);
  assert.equal(room2.participants.values().next().value.name, "Grace");
});

test("RoomManager - Delayed disconnect from old instance does not destroy newer instance", () => {
  const rm = new RoomManager({ disconnectGracePeriodMs: 50 });
  
  // Old instance
  const { room: oldRoom } = rm.joinRoom("RACE01", "OldUser", "socket-old");
  const oldInstanceId = oldRoom.instanceId;

  // Simulate old room is destroyed
  rm.destroyRoom(oldInstanceId);

  // New instance created with same code
  const { room: newRoom } = rm.joinRoom("RACE01", "NewUser", "socket-new");
  assert.notEqual(newRoom.instanceId, oldInstanceId);

  // Delayed cleanup call targeting old instance
  rm.destroyRoom(oldInstanceId);

  // New instance is untouched and remains active!
  const active = rm.getActiveRoom("RACE01");
  assert.ok(active);
  assert.equal(active.instanceId, newRoom.instanceId);
  assert.equal(active.status, "active");
});
