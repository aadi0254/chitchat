// @ts-check
const test = require("node:test");
const assert = require("node:assert/strict");
const { io } = require("socket.io-client");
const { createRealtimeServer } = require("../server/index");

/**
 * Helper to create connected Socket.IO client
 * @param {string} url
 * @returns {Promise<import("socket.io-client").Socket>}
 */
function createClient(url) {
  return new Promise((resolve, reject) => {
    const client = io(url, {
      transports: ["websocket"],
      forceNew: true,
      reconnection: false
    });
    client.on("connect", () => resolve(client));
    client.on("connect_error", (err) => reject(err));
  });
}

test("ChitChat Real-Time Integration Suite", async (t) => {
  // Start ephemeral server on random free port (port 0)
  const server = createRealtimeServer({
    disconnectGracePeriodMs: 400,
    rateLimitMaxPerWindow: 2000 // Allow high throughput in test suite
  });
  const port = await server.listen(0);
  const serverUrl = `http://localhost:${port}`;

  t.after(async () => {
    await server.close();
  });

  await t.test("Scenario 1 & 2: Two participants exchange messages in both directions", async () => {
    const clientA = await createClient(serverUrl);
    const clientB = await createClient(serverUrl);

    /** @type {any[]} */
    const receivedByA = [];
    /** @type {any[]} */
    const receivedByB = [];

    clientA.on("message", (msg) => receivedByA.push(msg));
    clientB.on("message", (msg) => receivedByB.push(msg));

    // Client A joins room DIALOG
    const joinARes = await new Promise((resolve) => {
      clientA.emit("join_room", { room: "DIALOG", name: "Alice" }, resolve);
    });
    assert.equal(joinARes.success, true);

    // Client B joins room DIALOG
    const joinBRes = await new Promise((resolve) => {
      clientB.emit("join_room", { room: "DIALOG", name: "Bob" }, resolve);
    });
    assert.equal(joinBRes.success, true);

    // Alice sends to Bob
    const sendResA = await new Promise((resolve) => {
      clientA.emit("send_message", { room: "DIALOG", text: "Hello Bob" }, resolve);
    });
    assert.equal(sendResA.success, true);

    // Bob sends to Alice
    const sendResB = await new Promise((resolve) => {
      clientB.emit("send_message", { room: "DIALOG", text: "Hi Alice" }, resolve);
    });
    assert.equal(sendResB.success, true);

    // Wait briefly for delivery
    await new Promise((r) => setTimeout(r, 100));

    const chatMsgsA = receivedByA.filter((m) => m.type === "chat");
    const chatMsgsB = receivedByB.filter((m) => m.type === "chat");

    assert.equal(chatMsgsA.length, 2);
    assert.equal(chatMsgsB.length, 2);
    assert.equal(chatMsgsA[0].text, "Hello Bob");
    assert.equal(chatMsgsA[1].text, "Hi Alice");

    await new Promise((res) => clientA.emit("leave_room", { room: "DIALOG" }, res));
    await new Promise((res) => clientB.emit("leave_room", { room: "DIALOG" }, res));
    clientA.disconnect();
    clientB.disconnect();
  });

  await t.test("Scenario 3 & 4: Continuous conversation beyond 200 and 1,000 messages", async () => {
    const sender = await createClient(serverUrl);
    const receiver = await createClient(serverUrl);

    /** @type {any[]} */
    const received = [];
    receiver.on("message", (msg) => {
      if (msg.type === "chat") received.push(msg);
    });

    await new Promise((resolve) => {
      sender.emit("join_room", { room: "LONG01", name: "Sender" }, resolve);
    });
    await new Promise((resolve) => {
      receiver.emit("join_room", { room: "LONG01", name: "Receiver" }, resolve);
    });

    // Send 1,050 messages continuously
    const totalMessages = 1050;
    for (let i = 1; i <= totalMessages; i++) {
      await new Promise((resolve) => {
        sender.emit("send_message", { room: "LONG01", text: `Msg #${i}` }, resolve);
      });
    }

    await new Promise((r) => setTimeout(r, 200));

    assert.equal(received.length, totalMessages);
    assert.equal(received[199].text, "Msg #200");
    assert.equal(received[999].text, "Msg #1000");
    assert.equal(received[1049].text, "Msg #1050");

    await new Promise((res) => sender.emit("leave_room", { room: "LONG01" }, res));
    await new Promise((res) => receiver.emit("leave_room", { room: "LONG01" }, res));
    sender.disconnect();
    receiver.disconnect();
  });

  await t.test("Scenario 5: Concurrent sends from multiple participants", async () => {
    const c1 = await createClient(serverUrl);
    const c2 = await createClient(serverUrl);
    const c3 = await createClient(serverUrl);

    /** @type {any[]} */
    const messages = [];
    c1.on("message", (m) => {
      if (m.type === "chat") messages.push(m);
    });

    await Promise.all([
      new Promise((res) => c1.emit("join_room", { room: "CONCUR", name: "User1" }, res)),
      new Promise((res) => c2.emit("join_room", { room: "CONCUR", name: "User2" }, res)),
      new Promise((res) => c3.emit("join_room", { room: "CONCUR", name: "User3" }, res))
    ]);

    // Send simultaneously
    const sends = [
      new Promise((res) => c1.emit("send_message", { room: "CONCUR", text: "From C1" }, res)),
      new Promise((res) => c2.emit("send_message", { room: "CONCUR", text: "From C2" }, res)),
      new Promise((res) => c3.emit("send_message", { room: "CONCUR", text: "From C3" }, res))
    ];
    await Promise.all(sends);

    await new Promise((r) => setTimeout(r, 100));
    assert.equal(messages.length, 3);

    await new Promise((res) => c1.emit("leave_room", { room: "CONCUR" }, res));
    await new Promise((res) => c2.emit("leave_room", { room: "CONCUR" }, res));
    await new Promise((res) => c3.emit("leave_room", { room: "CONCUR" }, res));
    c1.disconnect();
    c2.disconnect();
    c3.disconnect();
  });

  await t.test("Scenario 6: Cross-room message isolation", async () => {
    const clientRoom1 = await createClient(serverUrl);
    const clientRoom2 = await createClient(serverUrl);

    /** @type {any[]} */
    const room2Messages = [];
    clientRoom2.on("message", (m) => room2Messages.push(m));

    await new Promise((res) => clientRoom1.emit("join_room", { room: "ROOM1A", name: "User1" }, res));
    await new Promise((res) => clientRoom2.emit("join_room", { room: "ROOM2B", name: "User2" }, res));

    // Send in Room 1
    await new Promise((res) => clientRoom1.emit("send_message", { room: "ROOM1A", text: "Secret for Room 1" }, res));

    await new Promise((r) => setTimeout(r, 100));

    // Room 2 must NOT receive the message from Room 1
    const leak = room2Messages.find((m) => m.text === "Secret for Room 1");
    assert.equal(leak, undefined);

    // Leave rooms cleanly
    await new Promise((res) => clientRoom1.emit("leave_room", { room: "ROOM1A" }, res));
    await new Promise((res) => clientRoom2.emit("leave_room", { room: "ROOM2B" }, res));
    clientRoom1.disconnect();
    clientRoom2.disconnect();
  });

  await t.test("Scenario 7: Invalid and oversized messages rejected safely", async () => {
    const client = await createClient(serverUrl);
    await new Promise((res) => client.emit("join_room", { room: "VALID1", name: "ValUser" }, res));

    // Empty message
    const emptyRes = await new Promise((res) => client.emit("send_message", { room: "VALID1", text: "   " }, res));
    assert.equal(emptyRes.success, false);
    assert.match(emptyRes.error, /cannot be empty/);

    // Oversized message
    const hugeMsg = "X".repeat(1005);
    const hugeRes = await new Promise((res) => client.emit("send_message", { room: "VALID1", text: hugeMsg }, res));
    assert.equal(hugeRes.success, false);
    assert.match(hugeRes.error, /exceeds maximum length/);

    await new Promise((res) => client.emit("leave_room", { room: "VALID1" }, res));
    client.disconnect();
  });

  await t.test("Scenario 8 & 9: Disconnect presence and reconnection grace period", async () => {
    const alice = await createClient(serverUrl);
    const bob = await createClient(serverUrl);

    /** @type {any[]} */
    const bobLeftEvents = [];
    bob.on("user_left", (e) => bobLeftEvents.push(e));

    const joinAlice = await new Promise((res) => alice.emit("join_room", { room: "GRACE1", name: "Alice" }, res));
    await new Promise((res) => bob.emit("join_room", { room: "GRACE1", name: "Bob" }, res));

    const alicePid = joinAlice.participantId;

    // Alice disconnects
    alice.disconnect();

    // Within grace period (400ms on test server), Alice reconnects with alicePid
    await new Promise((r) => setTimeout(r, 50));
    const alice2 = await createClient(serverUrl);
    const rejoinRes = await new Promise((res) => {
      alice2.emit("join_room", { room: "GRACE1", name: "Alice", participantId: alicePid }, res);
    });
    assert.equal(rejoinRes.success, true);
    assert.equal(rejoinRes.participantId, alicePid);

    // Wait until initial grace period would have expired
    await new Promise((r) => setTimeout(r, 450));

    // Bob should NOT have received a user_left event because Alice reconnected in time!
    assert.equal(bobLeftEvents.length, 0);

    await new Promise((res) => alice2.emit("leave_room", { room: "GRACE1" }, res));
    await new Promise((res) => bob.emit("leave_room", { room: "GRACE1" }, res));
    alice2.disconnect();
    bob.disconnect();
  });

  await t.test("Scenario 10: Last participant leaves destroys room completely from server memory", async () => {
    const client = await createClient(serverUrl);
    await new Promise((res) => client.emit("join_room", { room: "LAST01", name: "Solo" }, res));
    await new Promise((res) => client.emit("send_message", { room: "LAST01", text: "Transient message" }, res));

    // Verify room is currently active in server memory
    const roomBefore = server.roomManager.getActiveRoom("LAST01");
    assert.ok(roomBefore);
    assert.equal(roomBefore.messages.length, 2); // 1 system + 1 chat

    // Solo leaves room explicitly
    const leaveRes = await new Promise((res) => client.emit("leave_room", { room: "LAST01" }, res));
    assert.equal(leaveRes.success, true);

    // Verify room is completely destroyed and purged from server memory
    const roomAfter = server.roomManager.getActiveRoom("LAST01");
    assert.equal(roomAfter, null);
    assert.equal(server.roomManager.roomsByCode.has("LAST01"), false);

    client.disconnect();
  });

  await t.test("Scenario 11 & 12: Explicit room closure rejects new messages", async () => {
    const c1 = await createClient(serverUrl);
    await new Promise((res) => c1.emit("join_room", { room: "CLOSE1", name: "Closer" }, res));

    // Close room
    await new Promise((res) => c1.emit("close_room", { room: "CLOSE1" }, res));

    // Room must be destroyed
    assert.equal(server.roomManager.getActiveRoom("CLOSE1"), null);

    // Attempting to send message to closed room fails
    const sendRes = await new Promise((res) => c1.emit("send_message", { room: "CLOSE1", text: "Late message" }, res));
    assert.equal(sendRes.success, false);

    c1.disconnect();
  });

  await t.test("Scenario 13 & 14: Reusing room code creates fresh room with no previous messages", async () => {
    const c1 = await createClient(serverUrl);
    const join1 = await new Promise((res) => c1.emit("join_room", { room: "REUSE2", name: "FirstUser" }, res));
    await new Promise((res) => c1.emit("send_message", { room: "REUSE2", text: "Old message 123" }, res));
    
    // First user leaves -> room destroyed
    await new Promise((res) => c1.emit("leave_room", { room: "REUSE2" }, res));
    assert.equal(server.roomManager.getActiveRoom("REUSE2"), null);

    // Later, new user joins same code
    const c2 = await createClient(serverUrl);
    const join2 = await new Promise((res) => c2.emit("join_room", { room: "REUSE2", name: "SecondUser" }, res));
    
    assert.notEqual(join2.instanceId, join1.instanceId);
    // Messages in new room should NOT contain old message
    assert.equal(join2.messages.some((m) => m.text === "Old message 123"), false);

    c1.disconnect();
    await new Promise((res) => c2.emit("leave_room", { room: "REUSE2" }, res));
    c2.disconnect();
  });

  await t.test("Scenario 15: Repeated creation and closure does not leak memory or room records", async () => {
    const initialStats = server.roomManager.getStats();

    for (let i = 0; i < 20; i++) {
      const client = await createClient(serverUrl);
      const code = `LEAK${String(i).padStart(2, "0")}`;
      await new Promise((res) => client.emit("join_room", { room: code, name: `User${i}` }, res));
      await new Promise((res) => client.emit("send_message", { room: code, text: `Test ${i}` }, res));
      await new Promise((res) => client.emit("leave_room", { room: code }, res));
      client.disconnect();
    }

    await new Promise((r) => setTimeout(r, 100));

    const finalStats = server.roomManager.getStats();
    assert.equal(finalStats.activeRooms, 0);
    assert.equal(finalStats.totalInstances, 0);
  });

  await t.test("Scenario 16: Phase 4 Room Synchronization & Participant Metadata Verification (10-step sequence)", async () => {
    // 1. Device A creates/joins a room
    const devA = await createClient(serverUrl);
    const devAMessages = [];
    let devARoster = [];
    devA.on("message", (m) => devAMessages.push(m));
    devA.on("user_joined", (e) => { devARoster = e.participants; });
    devA.on("user_left", (e) => { devARoster = e.participants; });

    const joinARes = await new Promise((res) => {
      devA.emit("join_room", { room: "SYNC01", name: "DeviceA" }, res);
    });
    assert.equal(joinARes.success, true);
    assert.equal(joinARes.participants.length, 1);
    assert.equal(joinARes.participants[0].name, "DeviceA");
    assert.ok(joinARes.participants[0].id);
    assert.ok(joinARes.participants[0].joinedAt);
    assert.equal(joinARes.participants[0].isOnline, true);
    devARoster = joinARes.participants;

    // 2. Device B joins using the same room code
    const devB = await createClient(serverUrl);
    const devBMessages = [];
    let devBRoster = [];
    devB.on("message", (m) => devBMessages.push(m));
    devB.on("user_joined", (e) => { devBRoster = e.participants; });
    devB.on("user_left", (e) => { devBRoster = e.participants; });

    const joinBRes = await new Promise((res) => {
      devB.emit("join_room", { room: "SYNC01", name: "DeviceB" }, res);
    });
    assert.equal(joinBRes.success, true);
    devBRoster = joinBRes.participants;

    // Wait briefly for join broadcast
    await new Promise((r) => setTimeout(r, 50));

    // 3. Both devices display the correct participant list with full metadata
    assert.equal(devARoster.length, 2);
    assert.equal(devBRoster.length, 2);
    assert.ok(devARoster.some((p) => p.name === "DeviceA" && p.id && p.joinedAt && p.isOnline));
    assert.ok(devARoster.some((p) => p.name === "DeviceB" && p.id && p.joinedAt && p.isOnline));
    assert.ok(devBRoster.some((p) => p.name === "DeviceA" && p.id && p.joinedAt && p.isOnline));
    assert.ok(devBRoster.some((p) => p.name === "DeviceB" && p.id && p.joinedAt && p.isOnline));

    // 4. Device A sends a message; device B receives it
    const sendA = await new Promise((res) => {
      devA.emit("send_message", { room: "SYNC01", text: "Hello from Device A" }, res);
    });
    assert.equal(sendA.success, true);

    await new Promise((r) => setTimeout(r, 50));
    const msgForB = devBMessages.find((m) => m.text === "Hello from Device A");
    assert.ok(msgForB);
    assert.equal(msgForB.sender, "DeviceA");

    // 5. Device B sends a reply; device A receives it
    const sendB = await new Promise((res) => {
      devB.emit("send_message", { room: "SYNC01", text: "Reply from Device B" }, res);
    });
    assert.equal(sendB.success, true);

    await new Promise((r) => setTimeout(r, 50));
    const msgForA = devAMessages.find((m) => m.text === "Reply from Device B");
    assert.ok(msgForA);
    assert.equal(msgForA.sender, "DeviceB");

    // 6. A third participant joins, and all active participants see the correct sidebar
    const devC = await createClient(serverUrl);
    const joinCRes = await new Promise((res) => {
      devC.emit("join_room", { room: "SYNC01", name: "DeviceC" }, res);
    });
    assert.equal(joinCRes.success, true);
    assert.equal(joinCRes.participants.length, 3);

    await new Promise((r) => setTimeout(r, 50));
    assert.equal(devARoster.length, 3);
    assert.equal(devBRoster.length, 3);

    // 7. A participant leaves, and the sidebar updates
    await new Promise((res) => devC.emit("leave_room", { room: "SYNC01" }, res));
    devC.disconnect();

    await new Promise((r) => setTimeout(r, 50));
    assert.equal(devARoster.length, 2);
    assert.equal(devBRoster.length, 2);
    assert.equal(devARoster.some((p) => p.name === "DeviceC"), false);

    // 8. Disconnect and reconnect a client and verify membership restoration
    const devBPid = joinBRes.participantId;
    devB.disconnect();

    // Reconnect client B within grace period
    const devB2 = await createClient(serverUrl);
    const reconnectBRes = await new Promise((res) => {
      devB2.emit("join_room", { room: "SYNC01", name: "DeviceB", participantId: devBPid }, res);
    });
    assert.equal(reconnectBRes.success, true);
    assert.equal(reconnectBRes.participantId, devBPid);
    assert.equal(reconnectBRes.participants.length, 2);

    // 9. Send more than 1,000 messages without an arbitrary total message-count limit
    for (let i = 1; i <= 1010; i++) {
      await new Promise((res) => {
        devA.emit("send_message", { room: "SYNC01", text: `Stress test #${i}` }, res);
      });
    }
    const roomRef = server.roomManager.getActiveRoom("SYNC01");
    assert.ok(roomRef);
    assert.ok(roomRef.messages.length > 1010);

    // 10. Confirm that separate rooms cannot see each other's messages or participants
    const devOther = await createClient(serverUrl);
    const devOtherMessages = [];
    devOther.on("message", (m) => devOtherMessages.push(m));

    const joinOtherRes = await new Promise((res) => {
      devOther.emit("join_room", { room: "ISOL88", name: "OtherUser" }, res);
    });
    assert.equal(joinOtherRes.participants.length, 1);
    assert.equal(joinOtherRes.participants[0].name, "OtherUser");

    // Device A sends in SYNC01
    await new Promise((res) => devA.emit("send_message", { room: "SYNC01", text: "Top secret SYNC01" }, res));
    await new Promise((r) => setTimeout(r, 50));

    // ISOL88 client must not receive message from SYNC01
    assert.equal(devOtherMessages.some((m) => m.text === "Top secret SYNC01"), false);

    // Cleanup
    await new Promise((res) => devA.emit("leave_room", { room: "SYNC01" }, res));
    await new Promise((res) => devB2.emit("leave_room", { room: "SYNC01" }, res));
    await new Promise((res) => devOther.emit("leave_room", { room: "ISOL88" }, res));
    devA.disconnect();
    devB2.disconnect();
    devOther.disconnect();
  });
});

