/**
 * Normalize an uploaded image URL for `next/image`.
 *
 * Uploads arrive from a few places over the years: absolute blob URLs,
 * protocol-relative URLs, bare relative paths, and inline data URLs from
 * client-side previews. Returns an empty string when there's nothing to render.
 */
export function resolveUploadUrl(url?: string | null): string {
  if (!url) return "";
  const value = String(url).trim();
  if (!value) return "";
  if (value.startsWith("data:") || value.startsWith("blob:")) return value;
  if (value.startsWith("https://")) return value;
  if (value.startsWith("http://")) return value.replace("http://", "https://");
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return value;
  return `/${value}`;
}

/** True for Google account photos (lh3 / googleusercontent CDNs). */
export function isGoogleAvatarUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host === "lh3.googleusercontent.com" ||
      host.endsWith(".googleusercontent.com") ||
      host === "googleusercontent.com"
    );
  } catch {
    return /googleusercontent\.com/i.test(url);
  }
}

/**
 * Data/blob URLs can't go through the optimizer.
 * Google avatar CDNs often 403 the Next image proxy and/or require no-referrer.
 */
export function isUnoptimizableUrl(url: string): boolean {
  return (
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    isGoogleAvatarUrl(url)
  );
}
