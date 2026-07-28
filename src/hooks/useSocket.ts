"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getSocketUrl } from "@/lib/chat/socketUrl";

let shared: Socket | null = null;

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function resolveShared(): Socket | null {
  if (shared) return shared;
  if (typeof globalThis !== "undefined" && (globalThis as any).__sparesx_socket) {
    shared = (globalThis as any).__sparesx_socket as Socket;
  }
  return shared;
}

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = getToken();
    const socketUrl = getSocketUrl();
    if (!token || !socketUrl) return;

    let socket = resolveShared();
    if (!socket || socket.disconnected) {
      socket = io(socketUrl, {
        auth: { token },
        transports: ["websocket", "polling"],
        autoConnect: true,
      });
      shared = socket;
      (globalThis as any).__sparesx_socket = socket;
    }

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
        const socket = socketRef.current || resolveShared();
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

  return { socket: socketRef.current || resolveShared(), connected, emitAck };
}

export function getSharedSocket() {
  return resolveShared();
}
