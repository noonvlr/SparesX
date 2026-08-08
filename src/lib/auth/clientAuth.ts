/**
 * Client auth helpers — dual-mode:
 * - Keep localStorage token for sockets + legacy call sites
 * - Always send credentials so HttpOnly session cookie is included
 * - Attach X-CSRF-Token from readable cookie for mutating requests
 */

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

export function setAccessToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
  window.dispatchEvent(new Event("sparesx-auth-changed"));
}

export function clearAccessToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  window.dispatchEvent(new Event("sparesx-auth-changed"));
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function getCsrfToken(): string | null {
  return readCookie("sparesx_csrf");
}

export function authHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

function isMutatingMethod(method?: string) {
  const m = (method || "GET").toUpperCase();
  return m !== "GET" && m !== "HEAD" && m !== "OPTIONS";
}

/** fetch with credentials + optional Bearer + CSRF header for mutations */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = authHeaders(init?.headers);
  // Let the browser set multipart boundary for FormData
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
