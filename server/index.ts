import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { verifyJwt } from "../src/lib/auth/jwt";
import { connectDB } from "../src/lib/db/connect";
import { registerSocketHandlers } from "./socket/handlers";

const PORT = Number(process.env.SOCKET_PORT || 4001);
const CLIENT_ORIGINS = (
  process.env.SOCKET_CORS_ORIGIN ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:3000"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function isDevOriginAllowed(origin?: string) {
  if (!origin) return true;
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      /^192\.168\./.test(hostname) ||
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
    );
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin?: string) {
  if (!origin) return true;
  if (CLIENT_ORIGINS.includes(origin)) return true;
  if (process.env.NODE_ENV !== "production" && isDevOriginAllowed(origin)) {
    return true;
  }
  return false;
}

const corsOrigin = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) => {
  if (isAllowedOrigin(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error(`Socket origin not allowed: ${origin || "unknown"}`));
};

async function main() {
  await connectDB();

  const app = express();
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    }),
  );
  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "sparesx-socket" });
  });

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
    maxHttpBufferSize: 256 * 1024,
    // Ready for @socket.io/redis-adapter later
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization
          ?.toString()
          .replace(/^Bearer\s+/i, "");
      if (!token) {
        console.warn("[socket] missing auth token", socket.handshake.headers.origin);
        return next(new Error("Unauthorized"));
      }
      const payload = verifyJwt(token);
      if (!payload?.id) {
        console.warn("[socket] invalid auth token", socket.handshake.headers.origin);
        return next(new Error("Unauthorized"));
      }

      const { User } = await import("../src/lib/models/User");
      const user = await User.findById(payload.id)
        .select("isBlocked role sessionVersion")
        .lean();
      if (!user || user.isBlocked) {
        return next(new Error("Unauthorized"));
      }
      const currentSv =
        typeof user.sessionVersion === "number" ? user.sessionVersion : 0;
      if (payload.sv !== currentSv) {
        return next(new Error("Unauthorized"));
      }

      socket.data.userId = String(user._id);
      socket.data.role = String(user.role);
      next();
    } catch {
      console.warn("[socket] auth verification failed", socket.handshake.headers.origin);
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `[socket] connected user=${socket.data.userId} origin=${socket.handshake.headers.origin || "unknown"}`,
    );
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
