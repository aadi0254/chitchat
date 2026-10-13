// @ts-check
const http = require("http");
const { parse } = require("url");
const { createRealtimeServer } = require("./server/index");

const isStandalone = process.env.STANDALONE === "true" || process.argv.includes("--standalone");
const defaultPort = isStandalone ? 3001 : 3000;
const port = parseInt(process.env.PORT || String(defaultPort), 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";

async function startServer() {
  if (isStandalone) {
    const serverInstance = createRealtimeServer({
      corsOrigin: process.env.CORS_ORIGIN || "*"
    });
    const actualPort = await serverInstance.listen(port, hostname);
    console.log(`> [ChitChat] Standalone Realtime Server listening on http://${hostname}:${actualPort}`);
    return serverInstance;
  }

  // Unified Mode: Run Next.js and Socket.IO on the same HTTP server
  try {
    // @ts-ignore
    const nextImport = require("next");
    const next = typeof nextImport === "function" ? nextImport : nextImport.default;
    const dev = process.env.NODE_ENV !== "production";
    const app = next({ dev, hostname, port });
    const handle = app.getRequestHandler();

    await app.prepare();

    /** @type {ReturnType<typeof createRealtimeServer> | null} */
    let serverInstance = null;

    const unifiedHttpServer = http.createServer((req, res) => {
      const parsedUrl = parse(req.url || "/", true);
      const { pathname } = parsedUrl;

      // Diagnostic / Health endpoints
      if (pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", mode: "unified", uptime: process.uptime() }));
        return;
      }

      // Ephemeral Room Inspection API (Diagnostic verification)
      if (serverInstance && pathname && pathname.startsWith("/api/rooms/")) {
        const roomCode = pathname.replace("/api/rooms/", "").trim().toUpperCase();
        const room = serverInstance.roomManager.getActiveRoom(roomCode);
        res.setHeader("Access-Control-Allow-Origin", "*");
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

      handle(req, res, parsedUrl);
    });

    serverInstance = createRealtimeServer({
      server: unifiedHttpServer,
      corsOrigin: "*"
    });

    await serverInstance.listen(port, hostname);
    console.log(`> [ChitChat] Unified Server (Next.js + Socket.IO) ready on http://localhost:${port}`);
    return serverInstance;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`> [ChitChat] Could not start in unified mode (${errorMsg}). Starting in standalone mode on port ${port}...`);
    const serverInstance = createRealtimeServer({
      corsOrigin: process.env.CORS_ORIGIN || "*"
    });
    const actualPort = await serverInstance.listen(port, hostname);
    console.log(`> [ChitChat] Standalone Realtime Server listening on http://${hostname}:${actualPort}`);
    return serverInstance;
  }
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error("Fatal error starting ChitChat server:", err);
    process.exit(1);
  });
}

module.exports = { startServer };
