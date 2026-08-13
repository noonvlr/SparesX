/**
 * Server-side allowlist for stored image URLs (listings, avatars).
 * Do not trust client MIME/filename — only accept known hosts / relative upload paths.
 */

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";
const GOOGLE_HOST_SUFFIX = ".googleusercontent.com";

function isAllowedHostname(hostname: string, allowGoogle: boolean): boolean {
  const host = hostname.toLowerCase();
  if (host === "public.blob.vercel-storage.com" || host.endsWith(BLOB_HOST_SUFFIX)) {
    return true;
  }
  if (allowGoogle) {
    if (
      host === "lh3.googleusercontent.com" ||
      host === "googleusercontent.com" ||
      host.endsWith(GOOGLE_HOST_SUFFIX)
    ) {
      return true;
    }
  }
  if (
    process.env.NODE_ENV === "development" &&
    (host === "localhost" || host === "127.0.0.1")
  ) {
    return true;
  }
  return false;
}

/**
 * Returns a safe URL string, or null if rejected.
 * Relative `/uploads/...` paths are allowed. Dangerous schemes are rejected.
 */
export function sanitizeStoredImageUrl(
  raw: unknown,
  options?: { allowGoogleAvatar?: boolean },
): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value || value.length > 2048) return null;

  const lower = value.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:") ||
    lower.startsWith("blob:")
  ) {
    return null;
  }

  // App-local uploads (dev filesystem or mirrored paths)
  if (value.startsWith("/uploads/")) {
    if (value.includes("..") || value.includes("\\")) return null;
    return value.slice(0, 512);
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol === "http:") {
    if (
      process.env.NODE_ENV !== "development" ||
      !isAllowedHostname(url.hostname, !!options?.allowGoogleAvatar)
    ) {
      return null;
    }
  } else if (url.protocol !== "https:") {
    return null;
  }

  if (!isAllowedHostname(url.hostname, !!options?.allowGoogleAvatar)) {
    return null;
  }

  return url.toString();
}

/** Filter a client-supplied images array for listing storage. */
export function sanitizeListingImageUrls(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  const out: string[] = [];
  for (const item of images) {
    const safe = sanitizeStoredImageUrl(item, { allowGoogleAvatar: false });
    if (safe) out.push(safe);
    if (out.length >= 12) break;
  }
  return out;
}
