const MAX_URL_LEN = 2048;

const PRIVATE_HOST_RE =
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0|::1|\[::1\])$/i;

function isPrivateIpv4(host: string): boolean {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const parts = m.slice(1).map(Number);
  if (parts.some((n) => n > 255)) return true;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

export type DestinationUrlResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

/**
 * Absolute http(s) only. Reject javascript/data, credentials, localhost/private hosts.
 * Used at save time and again at click redirect (no open redirects).
 */
export function validateDestinationUrl(raw: unknown): DestinationUrlResult {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: false, message: "Destination URL is required" };
  }
  const trimmed = raw.trim();
  if (trimmed.length > MAX_URL_LEN) {
    return { ok: false, message: "Destination URL is too long" };
  }
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:")
  ) {
    return { ok: false, message: "Destination URL scheme is not allowed" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, message: "Destination URL must be a valid absolute URL" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, message: "Destination URL must use http or https" };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, message: "Destination URL must not include credentials" };
  }

  const host = parsed.hostname.replace(/^\[|\]$/g, "");
  if (PRIVATE_HOST_RE.test(host) || isPrivateIpv4(host)) {
    return {
      ok: false,
      message: "Destination URL must not target localhost or private networks",
    };
  }

  return { ok: true, url: parsed.toString() };
}

/** Append UTM params when the destination has none. */
export function appendSponsoredUtm(
  destinationUrl: string,
  campaignSlug: string,
): string {
  try {
    const u = new URL(destinationUrl);
    if (!u.searchParams.has("utm_source")) {
      u.searchParams.set("utm_source", "sparesx");
    }
    if (!u.searchParams.has("utm_medium")) {
      u.searchParams.set("utm_medium", "sponsored");
    }
    if (!u.searchParams.has("utm_campaign")) {
      u.searchParams.set("utm_campaign", campaignSlug.slice(0, 64));
    }
    return u.toString();
  } catch {
    return destinationUrl;
  }
}
