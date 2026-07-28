import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { verifyJwt } from "../src/lib/auth/jwt";
import { connectDB } from "../src/lib/db/connect";
import { registerSocketHandlers } from "./socket/handlers";

const PORT = Number(process.env.SOCKET_PORT || 4001);
const CLIENT_ORIGIN =
  process.env.SOCKET_CORS_ORIGIN ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:3000";

async function main() {
  await connectDB();

  const app = express();
  app.use(
    cors({
      origin: CLIENT_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "sparesx-socket" });
  });

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: CLIENT_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
    },
    // Ready for @socket.io/redis-adapter later
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.toString().replace(/^Bearer\s+/i, "");
      if (!token) {
        return next(new Error("Unauthorized"));
      }
      const payload = verifyJwt(token);
      if (!payload?.id) {
        return next(new Error("Unauthorized"));
      }
      socket.data.userId = payload.id;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    registerSocketHandlers(io, socket);
  });

  server.listen(PORT, () => {
    console.log(`[socket] listening on :${PORT}`);
  });
}

main().catch((err) => {
  console.error("[socket] failed to start", err);
  process.exit(1);
});
