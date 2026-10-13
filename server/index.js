// @ts-check
const http = require("http");
const { Server: SocketIOServer } = require("socket.io");
const { RoomManager } = require("./room-manager");
const { registerSocketHandlers } = require("./socket-handlers");

/**
 * Creates and configures the ChitChat real-time backend server
 * @param {Object} [options]
 * @param {http.Server} [options.server] - Existing HTTP server to attach to
 * @param {string | string[]} [options.corsOrigin="*"] - Permitted CORS origins
 * @param {number} [options.disconnectGracePeriodMs=15000] - Grace period in ms
 * @param {number} [options.maxMessageLength=1000]
 * @param {number} [options.maxNameLength=30]
 * @param {number} [options.rateLimitMaxPerWindow=10]
 * @param {number} [options.rateLimitWindowMs=1000]
 */
function createRealtimeServer(options = {}) {
  const roomManager = new RoomManager({
    disconnectGracePeriodMs: options.disconnectGracePeriodMs,
    maxMessageLength: options.maxMessageLength,
    maxNameLength: options.maxNameLength,
    rateLimitMaxPerWindow: options.rateLimitMaxPerWindow,
    rateLimitWindowMs: options.rateLimitWindowMs
  });

  const httpServer = options.server || http.createServer((req, res) => {
    // Basic CORS headers for inspection endpoints
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    // Health check endpoint
    if (url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: "ok",
        uptime: process.uptime(),
        ...roomManager.getStats()
      }));
      return;
    }

    // Ephemeral Room Inspection API (Diagnostic verification for tests)
    // Never returns message contents - only existence and counts
    if (url.pathname.startsWith("/api/rooms/")) {
      const roomCode = url.pathname.replace("/api/rooms/", "").trim().toUpperCase();
      const room = roomManager.getActiveRoom(roomCode);
      if (!room) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ exists: false, room: roomCode }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        exists: true,
        room: room.code,
        instanceId: room.instanceId,
        participantCount: room.participants.size,
        onlineCount: Array.from(room.participants.values()).filter(p => p.isOnline).length,
        messageCount: room.messages.length
      }));
      return;
    }

    // Default response for standalone backend
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ name: "ChitChat Realtime Server", status: "online" }));
  });

  const corsOrigin = options.corsOrigin || process.env.CORS_ORIGIN || "*";

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin === "*" ? true : corsOrigin,
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 20000,
    pingInterval: 10000,
    transports: ["websocket", "polling"]
  });

  registerSocketHandlers(io, roomManager);

  /**
   * Start listening
   * @param {number} port
   * @param {string} [hostname="0.0.0.0"]
   * @returns {Promise<number>}
   */
  function listen(port, hostname = "0.0.0.0") {
    return new Promise((resolve, reject) => {
      httpServer.listen(port, hostname, () => {
        const addr = httpServer.address();
        const actualPort = typeof addr === "object" && addr ? addr.port : port;
        resolve(actualPort);
      });
      httpServer.on("error", reject);
    });
  }

  /**
   * Stop server and cleanup
   * @returns {Promise<void>}
   */
  function close() {
    return new Promise((resolve) => {
      // Disconnect all sockets
      io.close(() => {
        httpServer.close(() => {
          resolve();
        });
      });
    });
  }

  return {
    httpServer,
    io,
    roomManager,
    listen,
    close
  };
}

module.exports = { createRealtimeServer };
