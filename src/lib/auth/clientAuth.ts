/**
 * Client auth — cookie session + CSRF + silent refresh:
 * - REST: HttpOnly access cookie + CSRF
 * - On 401: one refresh attempt via /api/auth/refresh, then retry
 * - UI soft-gates: readable `sparesx_auth` flag cookie
 * - Socket: withCredentials only
 */

import { AUTH_FLAG_COOKIE, CSRF_COOKIE } from "@/lib/auth/cookieNames";

let cachedUserId: string | null = null;
let cachedRole: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(
      `(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`,
    ),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/** @deprecated Prefer isLoggedInClient() — localStorage JWT is no longer set. */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

/**
 * No-op store: keep signature for call sites, but clear any legacy token
 * and notify listeners. Session lives in HttpOnly cookie.
 */
export function setAccessToken(_token?: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("token");
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event("sparesx-auth-changed"));
}

export function clearAccessToken() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("token");
  } catch {
    // ignore
  }
  cachedUserId = null;
  cachedRole = null;
  window.dispatchEvent(new Event("sparesx-auth-changed"));
}

/** Soft UI gate — readable flag cookie (not a secret). */
export function isLoggedInClient(): boolean {
  if (cachedUserId) return true;
  if (readCookie(AUTH_FLAG_COOKIE) === "1") return true;
  // Fallback for sessions created before auth-flag cookie existed
  if (readCookie(CSRF_COOKIE)) return true;
  return false;
}

export function getCachedUserId(): string | null {
  return cachedUserId;
}

export function getCachedRole(): string | null {
  return cachedRole;
}

export function getCsrfToken(): string | null {
  return readCookie(CSRF_COOKIE);
}

/** Headers for REST — cookie auth only. */
export function authHeaders(init?: HeadersInit): Headers {
  return new Headers(init);
}

function isMutatingMethod(method?: string) {
  const m = (method || "GET").toUpperCase();
  return m !== "GET" && m !== "HEAD" && m !== "OPTIONS";
}

async function tryRefreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const build = () => {
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
  };

  let res = await build();
  if (res.status !== 401) return res;

  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.pathname
        : "";
  if (url.includes("/api/auth/refresh") || url.includes("/api/auth/login")) {
    return res;
  }

  const refreshed = await tryRefreshSession();
  if (!refreshed) return res;
  return build();
}

/** Resolve current user via cookie session; caches id/role for UI. */
export async function resolveSessionUserId(): Promise<string | null> {
  if (cachedUserId) return cachedUserId;
  try {
    const res = await authFetch("/api/auth/me");
    if (!res.ok) {
      cachedUserId = null;
      cachedRole = null;
      return null;
    }
    const data = await res.json();
    const id = data?.user?._id || data?.user?.id;
    if (id) {
      cachedUserId = String(id);
      if (data.user?.role) cachedRole = String(data.user.role);
      return cachedUserId;
    }
  } catch {
    // ignore
  }
  return null;
}

export function setCachedSessionUser(user: {
  _id?: string;
  id?: string;
  role?: string;
} | null) {
  if (!user) {
    cachedUserId = null;
    cachedRole = null;
    return;
  }
  const id = user._id || user.id;
  cachedUserId = id ? String(id) : null;
  cachedRole = user.role ? String(user.role) : null;
}
