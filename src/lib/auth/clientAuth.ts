/**
 * Client auth helpers — cookie-first REST (Phase 16):
 * - HttpOnly session cookie + CSRF for API calls
 * - Optional localStorage token kept only for Socket.io handshake
 *   (socket also accepts session cookie via withCredentials)
 */

let cachedUserId: string | null = null;

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

/** Still stores socket JWT when login returns one; REST no longer sends it. */
export function setAccessToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
  try {
    const id = JSON.parse(atob(token.split(".")[1]))?.id;
    if (id) cachedUserId = String(id);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event("sparesx-auth-changed"));
}

export function clearAccessToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  cachedUserId = null;
  window.dispatchEvent(new Event("sparesx-auth-changed"));
}

export function getCachedUserId(): string | null {
  if (cachedUserId) return cachedUserId;
  const token = getAccessToken();
  if (!token) return null;
  try {
    const id = JSON.parse(atob(token.split(".")[1]))?.id;
    if (id) {
      cachedUserId = String(id);
      return cachedUserId;
    }
  } catch {
    // ignore
  }
  return null;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(
      `(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`,
    ),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function getCsrfToken(): string | null {
  return readCookie("sparesx_csrf");
}

/** Headers for REST — cookie auth; do not attach Bearer (XSS surface). */
export function authHeaders(init?: HeadersInit): Headers {
  return new Headers(init);
}

function isMutatingMethod(method?: string) {
  const m = (method || "GET").toUpperCase();
  return m !== "GET" && m !== "HEAD" && m !== "OPTIONS";
}

/** Cookie + CSRF fetch. Bearer is intentionally omitted for REST. */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = authHeaders(init?.headers);
  if (typeof FormData !== "undefined" && init?.body instanceof FormData) {
    headers.delete("Content-Type");
  }
  if (isMutatingMethod(init?.method) && !headers.has("X-CSRF-Token")) {
    const csrf = getCsrfToken();
    if (csrf) headers.set("X-CSRF-Token", csrf);
  }
  return fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });
}

/** Resolve current user id via /api/auth/me (cookie session). */
export async function resolveSessionUserId(): Promise<string | null> {
  const cached = getCachedUserId();
  if (cached) return cached;
  try {
    const res = await authFetch("/api/auth/me");
    if (!res.ok) return null;
    const data = await res.json();
    const id = data?.user?._id || data?.user?.id;
    if (id) {
      cachedUserId = String(id);
      return cachedUserId;
    }
  } catch {
    // ignore
  }
  return null;
}
