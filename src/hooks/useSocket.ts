"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4001";

let shared: Socket | null = null;

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    if (!shared || shared.disconnected) {
      shared = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        autoConnect: true,
      });
    }

    const socket = shared;
    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const emitAck = useCallback(
    <T = unknown>(event: string, payload?: unknown): Promise<T> => {
      return new Promise((resolve, reject) => {
        const socket = socketRef.current || shared;
        if (!socket?.connected) {
          reject(new Error("Socket not connected"));
          return;
        }
        socket.timeout(10000).emit(event, payload, (err: Error | null, res: T) => {
          if (err) reject(err);
          else resolve(res);
        });
      });
    },
    [],
  );

  return { socket: socketRef.current || shared, connected, emitAck };
}

export function getSharedSocket() {
  return shared;
}
