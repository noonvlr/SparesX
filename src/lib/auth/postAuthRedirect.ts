/** Shared post-auth redirect after email/password or Google login. */

export type AuthSuccessPayload = {
  role: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  profileComplete?: boolean;
};

/**
 * `next` must be a same-origin relative path (no protocol / open redirect).
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const next = raw.trim();
  if (!next.startsWith("/")) return null;
  if (next.startsWith("//")) return null;
  if (next.includes("://")) return null;
  if (/[\r\n\\]/.test(next)) return null;
  return next;
}

export function getAuthNextPath(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return safeNextPath(params.get("next"));
}

/**
 * Decide where to send the user after a successful auth response.
 * Order: admin → incomplete profile → phone verify → next/dashboard.
 */
export function resolvePostAuthPath(data: AuthSuccessPayload): string {
  const next = getAuthNextPath();

  if (data.role === "admin") {
    return next || "/admin/dashboard";
  }

  if (data.profileComplete === false) {
    const q = next ? `?next=${encodeURIComponent(next)}` : "";
    return `/complete-profile${q}`;
  }

  if (!data.phoneVerified) {
    return next || "/verify";
  }

  if (data.role === "technician") {
    return next || "/technician/dashboard";
  }

  return next || "/";
}
