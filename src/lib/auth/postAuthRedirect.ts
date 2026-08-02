/** Shared post-auth redirect after email/password or Google login. */

export type AuthSuccessPayload = {
  role: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  profileComplete?: boolean;
};

export function getAuthNextPath(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("next");
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
    const q = next
      ? `?next=${encodeURIComponent(next)}`
      : "";
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
