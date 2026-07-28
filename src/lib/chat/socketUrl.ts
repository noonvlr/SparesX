"use client";

const EXPLICIT_SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
const SOCKET_PORT = process.env.NEXT_PUBLIC_SOCKET_PORT || "4001";

/**
 * Vercel cannot host the Socket.IO companion server.
 * Only connect when NEXT_PUBLIC_SOCKET_URL is set, or when developing on localhost.
 * Never invent `*.vercel.app:4001` — that always fails and leaves chat stuck Offline.
 */
export function getSocketUrl(): string | null {
  if (EXPLICIT_SOCKET_URL) return EXPLICIT_SOCKET_URL;
  if (typeof window === "undefined") return null;

  const host = window.location.hostname;
  const isLocal =
    host === "localhost" || host === "127.0.0.1" || host === "::1";
  if (!isLocal) return null;

  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  return `${protocol}//${host}:${SOCKET_PORT}`;
}
