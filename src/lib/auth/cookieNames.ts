/** Shared cookie names — safe for client + server imports. */

export const SESSION_COOKIE = "sparesx_session";
export const CSRF_COOKIE = "sparesx_csrf";
/** Readable logged-in flag for UI soft-gates (not a secret). */
export const AUTH_FLAG_COOKIE = "sparesx_auth";
/** HttpOnly rotating refresh token (longer-lived than access JWT). */
export const REFRESH_COOKIE = "sparesx_refresh";
/** Anonymous browser id used only to count unique visitors. */
export const VISIT_ID_COOKIE = "sparesx_vid";
/** UTC day (YYYY-MM-DD) this browser was last counted. */
export const VISIT_DAY_COOKIE = "sparesx_vday";
