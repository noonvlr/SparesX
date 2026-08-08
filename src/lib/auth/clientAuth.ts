/**
 * Client auth helpers — dual-mode:
 * - Keep localStorage token for sockets + legacy call sites
 * - Always send credentials so HttpOnly session cookie is included
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

export function authHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

/** fetch with credentials + optional Bearer from localStorage */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = authHeaders(init?.headers);
  // Let the browser set multipart boundary for FormData
  if (typeof FormData !== "undefined" && init?.body instanceof FormData) {
    headers.delete("Content-Type");
  }
  return fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });
}
